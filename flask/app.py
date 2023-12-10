"""
Application code
"""
########## IMPORTS ##########
import json
import os
import subprocess
from typing import List

from flask_login import (LoginManager, UserMixin, login_required, login_user,
                         logout_user)
from forms import *

from flask import (Flask, flash, redirect, render_template, request, session,
                   url_for)

########## GLOBAL VARIABLES ##########
app = Flask(__name__)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = "Please login first to access the website"
login_manager.login_message_category = 'warning'


app.config['SECRET_KEY'] = "feedback"

NODE_PATH = "usr/bin/node"
FABRIC_PATH = "/Users/abhimanyu_sharma/Desktop/Ashoka_Monsoon_23/Blockchain_Project/feedback/hyperledger/feedback/javascript"


########## CHAINCODE PROCESSOR ##########
def chaincode(args: List[str]) -> tuple[bool, dict]:
    """
    Execute the given chaincode
    """
    out:  dict = {}
    valid: bool = False

    # node + application + chaincode name + required arguments for chaincode
    args = ["node", os.path.join("..", "hyperledger", "feedback", "javascript", "application")] + \
        [args[0]] + args[1:]

    try:
        out = json.loads(subprocess.check_output(args).decode())
        valid = True

    except Exception as e:
        app.logger.error("Something went wrong: %s", e)
        valid = False

    return valid, out


class User(UserMixin):
    def __init__(self, email, password, user_type):
        self.id = email
        self.password = password
        self.user_type = user_type


@login_manager.user_loader
def load_user(user_id, password, type):
    valid, user_data = chaincode(["loginUser", user_id, password, type])
    if valid and user_data.get('message') == "success":
        response = user_data.get('response')
        user_type = response.get('type')
        return User(user_id, password, user_type)
    return None



@app.route("/")
@app.route("/home")
def home():
    return render_template('home.html')


@app.route("/user_auth")
def user_auth():
    return render_template('user_auth.html')


@app.route("/register", methods=['GET', 'POST'])
def register():
    registration_form = RegistrationForm()
    if request.method == 'POST':
        if registration_form.validate_on_submit():
            ashokaid = registration_form.ashokaid.data
            email_id = registration_form.email_id.data
            name = registration_form.name.data
            type = registration_form.type.data
            password = registration_form.password.data
            valid, output = chaincode(
                ['registerUser', email_id, ashokaid, name, password, type])
            if valid:
                # TODO: Parse Output after chaincode execution
                flash("Registration Request Sent Successfully. You will receive an email notification when your request is processed.", "success")
                return redirect(url_for('register'))
            else:
                flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('register'))
            # return render_template("register.html",form=registration_form)
    return render_template("register.html", form=registration_form)


@app.route("/login", methods=['GET', 'POST'])
def login():
    login_form = LoginForm()
    if request.method == 'POST':
        if login_form.validate_on_submit():
            email_id = login_form.email_id.data
            password = login_form.password.data
            type = login_form.type.data
            valid, output = chaincode(["loginUser", email_id, password, type])
            if valid:
                # TODO: Parse Output after chaincode execution
                if output.get('message') == "success":
                    session['email_id'] = email_id
                    response = output.get('response')
                    session['type'] = type
                    login_user()
                    # session['type'] = response.get('type')
                    flash("Login Successful", "success")
                    return redirect(url_for('display_requests'))
                else:
                    flash(f"{output.get('error')}", "danger")
                    print(output)
            else:
                flash("Something went wrong. Please try again.", "danger")
                print(valid, output)
            return redirect(url_for('login'))
    return render_template("login.html", form=login_form)


@app.route("/admin_dashboard")
def admin_dashboard():
    return render_template("admin_dashboard.html")


@app.route("/admin_login", methods=['GET', 'POST'])
def admin_login():
    admin_login_form = AdminLoginForm()
    if 'admin_password' in session:
        if request.method == 'POST':
            if admin_login_form.validate_on_submit():
                password = admin_login_form.password.data
                valid, output = chaincode(
                    ['loginUser', 'admin@ashoka.edu.in', password, 'university'])
                if valid:
                    if output.get('message') == "success":
                        session['admin_email'] = "admin@ashoka.edu.in"
                        flash("Admin Logged in Successfully", "success")
                        return redirect(url_for('admin_dashboard'))
                    else:
                        flash(f"{output.get('error')}", "danger")
                        print(output)
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_login'))
        return render_template("admin_login.html", form=admin_login_form)
    else:
        flash("You have to be an admin to access this page. Please login first", "danger")
        return redirect(url_for('admin_login'))


@app.route("/user_registration_requests", methods=['GET', 'POST'])
def user_registration_requests():
    if 'admin_email' in session:
        accept_user_registration_request_form = AcceptUserRegistrationRequestForm()
        reject_user_registration_request_form = RejectUserRegistrationRequestForm()
        if request.method == 'POST' and 'accept' in request.form:
            if accept_user_registration_request_form.validate_on_submit():
                request_key = accept_user_registration_request_form.request_key.data
                valid, output = chaincode(
                    ["validateUser", session['email_id'], request_key])
                if valid:
                    if output.get('message') == "success":
                        
                        flash("Request Accepted!", "success")
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('user_registration_requests'))
        if request.method == 'POST' and 'reject' in request.form:
            if reject_user_registration_request_form.validate_on_submit():
                request_key = reject_user_registration_request_form.request_key.data
                valid, output = chaincode(
                    ["deleteUser", session['email_id'], request_key])
                if valid:
                    if output.get('message') == "success":
                        flash("Request Rejected!", "success")
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('user_registration_requests'))
        #which function to use to get registration requests
        valid, output = chaincode(['queryUnverifiedUsers', 'admin@ashoka.edu.in', 'university'])
        if valid:
            if output.get('message') == 'success':
                reg_requests = output.get('response')
        return render_template("user_registration_requests.html", reg_requests = reg_requests, accept_user_registration_request_form=accept_user_registration_request_form, reject_user_registration_request_form=reject_user_registration_request_form)
    else:
        flash("You have to be an admin to access this page. Please login first", "danger")
        return redirect(url_for('admin_login'))


@app.route("/admin_display_requests", methods=['GET', 'POST'])
def admin_display_requests():
    initiate_request_form = InitiateRequestForm()
    hold_request_form = HoldRequestForm()
    resume_request_form = ResumeRequestForm()
    finish_request_form = FinishRequestForm()
    drop_request_form = DropRequestForm()
    if request.method == "POST" and 'initiate' in request.form:
        if initiate_request_form.validate_on_submit():
            request_id = initiate_request_form.request_id.data
            valid, output = chaincode(
                ["updateRequest", request_id, "Initiating Request", "in progress"])
            if valid:
                flash("Request Initiated!", "success")
                return redirect(url_for('admin_display_requests'))
            else:
                flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests'))
    elif request.method == "POST" and 'finish' in request.form:
        if finish_request_form.validate_on_submit():
            request_id = finish_request_form.request_id.data
            valid, output = chaincode(
                ["updateRequest", request_id, "Request Implemented", "implemented"])
            if valid:
                flash("Request Completed!", "success")
                return redirect(url_for('admin_display_requests'))
            else:
                flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests'))
    elif request.method == "POST" and 'put_on_hold' in request.form:
        if hold_request_form.validate_on_submit():
            request_id = hold_request_form.request_id.data
            valid, output = chaincode(
                ["updateRequest", request_id, "Request On Hold", "on hold"])
            if valid:
                flash("Request On Hold!", "success")
                return redirect(url_for('admin_display_requests'))
            else:
                flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests'))
    elif request.method == "POST" and 'resume' in request.form:
        if resume_request_form.validate_on_submit():
            request_id = resume_request_form.request_id.data
            valid, output = chaincode(
                ["updateRequest", request_id, "Request Resumed", "in progress"])
            if valid:
                flash("Request Resumed!", "success")
                return redirect(url_for('admin_display_requests'))
            else:
                flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests'))
    elif request.method == "POST" and 'drop' in request.form:
        if drop_request_form.validate_on_submit():
            request_id = drop_request_form.request_id.data
            valid, output = chaincode(
                ["updateRequest", request_id, "Request Dropped", "dropped"])
            if valid:
                flash("Request Dropped!", "success")
                return redirect(url_for('admin_display_requests'))
        elif request.method == 'POST' and 'faculty' in request.form:
            if filter_faculty_requests_form.validate_on_submit():
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'false', 'faculty'])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter='faculty')
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests'))

    return render_template("admin_display_requests.html", requests=requests, initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form)


@app.route("/add_request", methods=['GET', 'POST'])
@login_required
def add_request():
    add_request_form = AddRequestForm()
    if request.method == 'POST':
        if add_request_form.validate_on_submit():
            description = add_request_form.description.data
            valid, output = chaincode(
                ["addRequest", description, session['type']])
            if valid:
                if output.get('message') == 'success':
                    flash("Request Added Successfully", "success")
                else:
                    flash(f"{output.get('error')}", "danger")
            else:
                flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('add_request'))
    return render_template("add_request.html", form=add_request_form)


@app.route("/display_requests", methods=['GET', 'POST'])
@login_required
def display_requests():
    confirm_request_form = ConfirmRequestForm()
    view_history_form = ViewHistoryForm()
    filter_confirmed_requests_form = FilterConfirmedRequestsForm()
    filter_unconfirmed_requests_form = FilterUnconfirmedRequestsForm()

    if request.method == 'POST' and 'confirmed_requests' in request.form:
        if filter_confirmed_requests_form.validate_on_submit():
            valid, requests = chaincode(
                ["displayRequests", session['type'], 'confirmed'])
            return render_template("display_requests.html", requests=requests, filter_confirmed_requests_form=filter_confirmed_requests_form, filter_unconfirmed_requests_form=filter_unconfirmed_requests_form, view_history_form=view_history_form, confirm_request_form=confirm_request_form)

    if request.method == 'POST' and 'unconfirmed_requests' in request.form:
        if filter_unconfirmed_requests_form.validate_on_submit():
            valid, requests = chaincode(
                ["displayRequests", session['type'], 'unconfirmed'])
            return render_template("display_requests.html", requests=requests, filter_confirmed_requests_form=filter_confirmed_requests_form, filter_unconfirmed_requests_form=filter_unconfirmed_requests_form, view_history_form=view_history_form, confirm_request_form=confirm_request_form)

    valid, requests = chaincode(["displayRequests", session['type'], 'all'])

    # Assuming requests is a list of dictionaries
    return render_template("display_requests.html", requests=requests, filter_confirmed_requests_form=filter_confirmed_requests_form, filter_unconfirmed_requests_form=filter_unconfirmed_requests_form, view_history_form=view_history_form, confirm_request_form=confirm_request_form)


@app.route('/confirm_request', methods=['POST'])
def confirm_request():
    confirm_request_form = ConfirmRequestForm()
    if request.method == 'POST' and 'confirm' in request.form:
        if confirm_request_form.validate_on_submit():
            email_id = confirm_request_form.email_id.data
            request_id = confirm_request_form.request_id.data
            name = confirm_request_form.name.data
            valid, output = chaincode(
                ["confirmRequest", request_id, email_id, name])
            if valid:
                if output.get('message') == 'success':
                    flash("Request Confirmed!", "success")
                else:
                    flash(f"{output.get('error')}", "danger")
            else:
                flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('display_requests'))


@app.route('/view_history', methods=['POST'])
def view_history():
    view_history_form = ViewHistoryForm()
    if request.method == 'POST':
        if view_history_form.validate_on_submit():
            request_id = view_history_form.request_id.data
            valid, history = chaincode(['queryRequestHistory', request_id])
            return render_template("view_history.html", history=history)


@app.route("/admin_logout")
def admin_logout():
    if 'admin_email' in session:
        session.pop('admin_email')
        flash("Logged out successfully", "success")
        return redirect(url_for("home"))
    else:
        flash("You have to be an admin to access this!", "warning")
        return redirect(url_for("home"))


@app.route("/logout")
@login_required
def logout():
    session.pop('email_id')
    session.pop('type')
    logout_user()
    flash("You have been logged out.", "success")
    return redirect(url_for('home'))


if __name__ == '__main__':
    app.run(debug=True)
