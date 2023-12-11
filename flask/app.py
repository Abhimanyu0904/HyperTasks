"""
Application code
"""
########## IMPORTS ##########
import json
import os
import secrets
import smtplib
import ssl
import subprocess
from email.message import EmailMessage
from typing import List

from flask_login import (LoginManager, UserMixin, login_required, login_user,
                         logout_user)
from forms import *

from flask import (Flask, flash, redirect, render_template, request, session,
                   url_for)

########## GLOBAL VARIABLES ##########
app = Flask(__name__)
app.secret_key = secrets.token_hex()  # generate new secret for every run

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = "Please login first to access the website"
login_manager.login_message_category = 'warning'


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


def send_email(to: str, accepted: bool) -> bool:
    sender = "my_hyperledger_21@hotmail.com"
    password = "tudxim-mIbmew-barzo4"
    subject = ""
    message = ""
    valid = True

    if accepted:
        subject = "User Verified"
        message = "Your credentials were approved! You can now log in to the website and add your requests!"
    else:
        subject = "User Rejected"
        message = "Your credentials were not approved. Please try registering again with the proper credentials. If you think your credentials are correct, you can reply to this mail and we will get back to you at our earliest. Thank you!"

    email = EmailMessage()
    email["From"] = sender
    email["To"] = to
    email["Subject"] = subject
    email.set_content(message)

    try:
        server = smtplib.SMTP("smtp-mail.outlook.com", 587)
        # Secure the connection
        server.starttls(context=ssl.create_default_context())
        server.login(sender, password)
        server.sendmail(sender, to, email.as_string())
    except Exception as e:
        valid = False
        print(e)

    finally:
        server.quit()

    return valid


class User(UserMixin):
    def __init__(self, email):
        self.id = email
        # self.password = password
        # self.user_type = user_type


@login_manager.user_loader
def load_user(user_id):
    # valid, user_data = chaincode(["loginUser", user_id, password, type])
    # if valid and user_data.get('message') == "success":
    return User(user_id)
    # return None

#All forms used in navbar
@app.context_processor
def base():
    filter_student_requests_form = FilterStudentRequestsForm()
    filter_faculty_requests_form = FilterFacultyRequestsForm()
    filter_student_registration_requests_form = FilterStudentRegistrationRequestsForm()
    filter_faculty_registration_requests_form = FilterFacultyRegistrationRequestsForm()
    filter_confirmed_requests_form = FilterConfirmedRequestsForm()
    filter_unconfirmed_requests_form = FilterUnconfirmedRequestsForm()
    filter_dropped_student_requests_form = FilterDroppedStudentRequestsForm()
    filter_dropped_faculty_requests_form = FilterDroppedFacultyRequestsForm()
    filter_implemented_student_requests_form = FilterImplementedStudentRequestsForm()
    filter_implemented_faculty_requests_form = FilterImplementedFacultyRequestsForm()
    filter_in_progress_student_requests_form = FilterInProgressStudentRequestsForm()
    filter_in_progress_faculty_requests_form = FilterInProgressFacultyRequestsForm()
    filter_on_hold_student_requests_form = FilterOnHoldStudentRequestsForm()
    filter_on_hold_faculty_requests_form = FilterOnHoldFacultyRequestsForm()
    filter_not_started_student_requests_form = FilterNotStartedStudentRequestsForm()
    filter_not_started_faculty_requests_form = FilterNotStartedFacultyRequestsForm()
    
    return dict(filter_student_requests_form=filter_student_requests_form,
                filter_faculty_requests_form=filter_faculty_requests_form,
                filter_student_registration_requests_form=filter_student_registration_requests_form,
                filter_faculty_registration_requests_form=filter_faculty_registration_requests_form,
                filter_confirmed_requests_form=filter_confirmed_requests_form,
                filter_unconfirmed_requests_form=filter_unconfirmed_requests_form,
                filter_dropped_student_requests_form=filter_dropped_student_requests_form,
                filter_dropped_faculty_requests_form=filter_dropped_faculty_requests_form,
                filter_implemented_student_requests_form=filter_implemented_student_requests_form,
                filter_implemented_faculty_requests_form=filter_implemented_faculty_requests_form,
                filter_in_progress_student_requests_form=filter_in_progress_student_requests_form,
                filter_in_progress_faculty_requests_form=filter_in_progress_faculty_requests_form,
                filter_on_hold_student_requests_form=filter_on_hold_student_requests_form,
                filter_on_hold_faculty_requests_form=filter_on_hold_faculty_requests_form,
                filter_not_started_student_requests_form=filter_not_started_student_requests_form,
                filter_not_started_faculty_requests_form=filter_not_started_faculty_requests_form)


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
                if output.get('message') == 'success':
                    flash(
                        "Registration Request Sent Successfully. You will receive an email notification when your request is processed.", "success")
                else:
                    flash(f"{output.get('error')}", "danger")
            else:
                flash("Something went wrong. Please try again.", "danger")
                print(valid, output)
            return redirect(url_for('register'))
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
                if output.get('message') == "success":
                    session['email_id'] = email_id
                    response = output.get('response')
                    session['type'] = type
                    login_user(User(email_id))
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
    if 'admin_email' in session:
        return render_template("admin_dashboard.html")
    else:
        flash("You have to be an admin to access this page. Please login first", "danger")
        return redirect(url_for('admin_login'))


@app.route("/admin_login", methods=['GET', 'POST'])
def admin_login():
    admin_login_form = AdminLoginForm()
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


@app.route("/user_registration_requests", methods=['GET', 'POST'])
def user_registration_requests():
    if 'admin_email' in session:
        accept_user_registration_request_form = AcceptUserRegistrationRequestForm()
        reject_user_registration_request_form = RejectUserRegistrationRequestForm()
        filter_student_registration_requests_form = FilterStudentRegistrationRequestsForm()
        filter_faculty_registration_requests_form = FilterFacultyRegistrationRequestsForm()

        if request.method == 'POST' and 'accept' in request.form:
            if accept_user_registration_request_form.validate_on_submit():
                email = accept_user_registration_request_form.email_id.data
                type = accept_user_registration_request_form.type.data
                print("__________________________")
                print(type)
                print("__________________________")
                valid, output = chaincode(
                    ["validateUser", 'admin@ashoka.edu.in', email, type])
                print(output)
                if valid:
                    if output.get('message') == "success":
                        valid2 = send_email(email, True)
                        if valid2:
                            flash("Registration Request Accepted! Email Sent Successfully", "success")
                            return redirect(url_for('user_registration_requests', type = type))
                        else:
                            flash("Registration Request Accepted but some issue in sending the email!", 'danger')
                            return redirect(url_for('user_registration_requests', type = type))
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('user_registration_requests', type = type))
        if request.method == 'POST' and 'reject' in request.form:
            if reject_user_registration_request_form.validate_on_submit():
                email = reject_user_registration_request_form.email_id.data
                type = reject_user_registration_request_form.type.data
                valid, output = chaincode(
                    ["deleteUser", 'admin@ashoka.edu.in', type, email])
                if valid:
                    if output.get('message') == "success":
                        valid2 = send_email(email, False)
                        if valid2:
                            flash("Registration Request Rejected! Email Sent Successfully", "success")
                            return redirect(url_for('user_registration_requests'), type = type)
                        else:
                            flash("Registration Request Rejected but some issue in sending the email!", 'danger')
                            return redirect(url_for('user_registration_requests'), type = type)
                        # return redirect(request.referrer)
                    else:
                        flash(f"{output.get('error')}", "danger")
                        return redirect(url_for('user_registration_requests'), type = type)
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(request.referrer)

        if request.method == 'POST' and 'student_registration_requests' in request.form:
            if filter_student_registration_requests_form.validate_on_submit():
                filter = "Student"
                valid, output = chaincode(
                    ["queryUnverifiedUsers", 'admin@ashoka.edu.in', filter.lower()])
                if valid:
                    if output.get('message') == "success":
                        reg_requests = output.get('response')
                        return render_template("user_registration_requests.html", reg_requests=reg_requests, accept_user_registration_request_form=accept_user_registration_request_form, reject_user_registration_request_form=reject_user_registration_request_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('user_registration_requests'))
            else:
                print(filter_student_registration_requests_form.errors)

        if request.method == 'POST' and 'faculty_registration_requests' in request.form:
            if filter_faculty_registration_requests_form.validate_on_submit():
                filter = "Faculty"
                valid, output = chaincode(
                    ["queryUnverifiedUsers", 'admin@ashoka.edu.in', filter.lower()])
                if valid:
                    if output.get('message') == "success":
                        reg_requests = output.get('response')
                        return render_template("user_registration_requests.html", reg_requests=reg_requests, accept_user_registration_request_form=accept_user_registration_request_form, reject_user_registration_request_form=reject_user_registration_request_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(request.referrer)

        type = request.args.get('type', 'student')
        valid, output = chaincode(
            ['queryUnverifiedUsers', 'admin@ashoka.edu.in', type])

        if valid:
            if output.get('message') == 'success':
                reg_requests = output.get('response')
        return render_template("user_registration_requests.html", reg_requests=reg_requests, accept_user_registration_request_form=accept_user_registration_request_form, reject_user_registration_request_form=reject_user_registration_request_form, filter=type.title())
    else:
        flash("You have to be an admin to access this page. Please login first", "danger")
        return redirect(url_for('admin_login'))


@app.route("/admin_display_requests", methods=['GET', 'POST'])
def admin_display_requests():
    if 'admin_email' in session:
        status = 'All'
        initiate_request_form = InitiateRequestForm()
        hold_request_form = HoldRequestForm()
        resume_request_form = ResumeRequestForm()
        finish_request_form = FinishRequestForm()
        drop_request_form = DropRequestForm()
        filter_student_requests_form = FilterStudentRequestsForm()
        filter_faculty_requests_form = FilterFacultyRequestsForm()
        filter_dropped_student_requests_form = FilterDroppedStudentRequestsForm()
        filter_dropped_faculty_requests_form = FilterDroppedFacultyRequestsForm()
        filter_implemented_student_requests_form = FilterImplementedStudentRequestsForm()
        filter_implemented_faculty_requests_form = FilterImplementedFacultyRequestsForm()
        filter_in_progress_student_requests_form = FilterInProgressStudentRequestsForm()
        filter_in_progress_faculty_requests_form = FilterInProgressFacultyRequestsForm()
        filter_on_hold_student_requests_form = FilterOnHoldStudentRequestsForm()
        filter_on_hold_faculty_requests_form = FilterOnHoldFacultyRequestsForm()
        filter_not_started_student_requests_form = FilterNotStartedStudentRequestsForm()
        filter_not_started_faculty_requests_form = FilterNotStartedFacultyRequestsForm()
        if request.method == "POST" and 'initiate' in request.form:
            if initiate_request_form.validate_on_submit():
                request_key = initiate_request_form.request_key.data
                type = initiate_request_form.type.data
                valid, output = chaincode(
                    ["updateRequest", session['admin_email'], "Initiating Request", "in progress", request_key])
                if valid:
                    if output.get('message') == "success":
                        flash("Request Initiated!", "success")
                        valid2, output2 = chaincode(['queryRequests', session['admin_email'], 'true', type])
                        if valid2:
                            if output2.get('message') == 'success':
                                return render_template("admin_display_requests.html", requests=output2.get('response'), status = 'in progress', initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form)
                            else:
                                flash(f"{output2.get('error')}", "danger")
                        else:
                            flash("Something went wrong. Please try again.", "danger")
                        return redirect(url_for('admin_display_requests', type=type))
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type=type))
        elif request.method == "POST" and 'finish' in request.form:
            if finish_request_form.validate_on_submit():
                request_key = finish_request_form.request_key.data
                type = initiate_request_form.type.data
                print("__________________________")
                print(type)
                print("__________________________")
                valid, output = chaincode(
                    ["updateRequest", session['admin_email'], "Request Implemented", "implemented", request_key])
                if valid:
                    if output.get('message') == 'success':
                        flash("Request Completed!", "success")
                        valid2, output2 = chaincode(['queryRequests', session['admin_email'], 'true', type])
                        if valid2:
                            if output2.get('message') == 'success':
                                return render_template("admin_display_requests.html", requests=output2.get('response'), status = 'implemented', initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form)
                            else:
                                flash(f"{output2.get('error')}", "danger")
                        else:
                            flash("Something went wrong. Please try again.", "danger")
                        return redirect(url_for('admin_display_requests', type=type))
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type=type))
        elif request.method == "POST" and 'put_on_hold' in request.form:
            if hold_request_form.validate_on_submit():
                request_key = hold_request_form.request_key.data
                type = initiate_request_form.type.data
                print("__________________________")
                print(type)
                print("__________________________")
                valid, output = chaincode(
                    ["updateRequest", session['admin_email'], "Request On Hold", "on hold", request_key])
                if valid:
                    if output.get('message') == 'success':
                        flash("Request On Hold!", "success")
                        valid2, output2 = chaincode(['queryRequests', session['admin_email'], 'true', type])
                        if valid2:
                            if output2.get('message') == 'success':
                                return render_template("admin_display_requests.html", requests=output2.get('response'), status = 'on hold', initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form)
                            else:
                                flash(f"{output2.get('error')}", "danger")
                        else:
                            flash("Something went wrong. Please try again.", "danger")
                        return redirect(url_for('admin_display_requests', type=type))
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type=type))
            
        elif request.method == "POST" and 'resume' in request.form:
            if resume_request_form.validate_on_submit():
                request_key = resume_request_form.request_key.data
                type = initiate_request_form.type.data
                print("__________________________")
                print(type)
                print("__________________________")
                valid, output = chaincode(
                    ["updateRequest", session['admin_email'], "Request Resumed", "in progress", request_key])
                if valid:
                    if output.get('message') == 'success':
                        flash("Request Resumed!", "success")
                        valid2, output2 = chaincode(['queryRequests', session['admin_email'], 'true', type])
                        if valid2:
                            if output2.get('message') == 'success':
                                return render_template("admin_display_requests.html", requests=output2.get('response'), status = 'in progress', initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form)
                            else:
                                flash(f"{output2.get('error')}", "danger")
                        else:
                            flash("Something went wrong. Please try again.", "danger")
                        return redirect(url_for('admin_display_requests', type=type))
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests'), type = type)

        elif request.method == "POST" and 'drop' in request.form:
            if drop_request_form.validate_on_submit():
                request_key = drop_request_form.request_key.data
                type = initiate_request_form.type.data
                valid, output = chaincode(
                    ["updateRequest", session['admin_email'], "Request Dropped", "dropped", request_key])
                if valid:
                    if output.get('message') == 'success':
                        flash("Request Dropped!", "success")
                        valid2, output2 = chaincode(['queryRequests', session['admin_email'], 'true', type])
                        if valid2:
                            if output2.get('message') == 'success':
                                return render_template("admin_display_requests.html", requests=output2.get('response'), status = 'dropped', initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form)
                            else:
                                flash(f"{output2.get('error')}", "danger")
                        else:
                            flash("Something went wrong. Please try again.", "danger")
                        return redirect(url_for('admin_display_requests', type=type))
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type=type))


        elif request.method == 'POST' and 'student_requests' in request.form:
            if filter_student_requests_form.validate_on_submit():
                filter = "Student"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = 'All',initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='student'))
            
        elif request.method == 'POST' and 'faculty_requests' in request.form:
            if filter_faculty_requests_form.validate_on_submit():
                filter = "Faculty"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = 'All',initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='faculty'))          
              
        elif request.method == 'POST' and 'dropped_student_requests' in request.form:
            if filter_dropped_student_requests_form.validate_on_submit():
                filter = "Student"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = "dropped", initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='student'))
            
        elif request.method == 'POST' and 'dropped_faculty_requests' in request.form:
            if filter_dropped_faculty_requests_form.validate_on_submit():
                filter = "Faculty"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = "dropped", initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='faculty'))

        elif request.method == 'POST' and 'implemented_student_requests' in request.form:
            if filter_implemented_student_requests_form.validate_on_submit():
                filter = "Student"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = "implemented", initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='student'))
            
        elif request.method == 'POST' and 'implemented_faculty_requests' in request.form:
            if filter_implemented_faculty_requests_form.validate_on_submit():
                filter = "Faculty"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = "implemented", initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='faculty'))

        elif request.method == 'POST' and 'on_hold_student_requests' in request.form:
            if filter_on_hold_student_requests_form.validate_on_submit():
                filter = "Student"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = "on hold", initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='student'))
        elif request.method == 'POST' and 'on_hold_faculty_requests' in request.form:
            if filter_on_hold_faculty_requests_form.validate_on_submit():
                filter = "Faculty"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = "on hold", initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='faculty'))

        elif request.method == 'POST' and 'in_progress_student_requests' in request.form:
            if filter_in_progress_student_requests_form.validate_on_submit():
                filter = "Student"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = "in progress", initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='student'))
            
        elif request.method == 'POST' and 'in_progress_faculty_requests' in request.form:
            if filter_in_progress_faculty_requests_form.validate_on_submit():
                filter = "Faculty"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = "in progress", initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='faculty'))

        elif request.method == 'POST' and 'not_started_student_requests' in request.form:
            if filter_not_started_student_requests_form.validate_on_submit():
                filter = "Student"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = "not started", initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='student'))
        elif request.method == 'POST' and 'not_started_faculty_requests' in request.form:
            if filter_not_started_faculty_requests_form.validate_on_submit():
                filter = "Faculty"
                valid, output = chaincode(
                    ['queryRequests', 'admin@ashoka.edu.in', 'true', filter.lower()])
                if valid:
                    if output.get('message') == 'success':
                        return render_template("admin_display_requests.html", requests=output.get('response'), status = "not started", initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter_student_requests_form=filter_student_requests_form, filter_faculty_requests_form=filter_faculty_requests_form, filter=filter)
                    else:
                        flash(f"{output.get('error')}", "danger")
                else:
                    flash("Something went wrong. Please try again.", "danger")
                return redirect(url_for('admin_display_requests', type='faculty'))
        
        type = request.args.get('type', 'student')
        print("__________________________")
        print(type)
        print("__________________________")

        # by default student requests open first
        valid, output = chaincode(
            ['queryRequests', 'admin@ashoka.edu.in', 'false', type])
        if not valid:
            flash("Something went wrong. Please try again.", "danger")
            return redirect(url_for('admin_display_requests', type = type))

        if output.get('message') != 'success':
            flash(f"{output.get('error')}", "danger")
            return redirect(url_for('admin_display_requests', type = type))

        return render_template("admin_display_requests.html", requests=output.get('response'), status = 'All',initiate_request_form=initiate_request_form, finish_request_form=finish_request_form, hold_request_form=hold_request_form, resume_request_form=resume_request_form, drop_request_form=drop_request_form, filter=type.title())
    else:
        flash("You have to be an admin to access this page. Please login first", "danger")
        return redirect(url_for('admin_login'))


@app.route("/add_request", methods=['GET', 'POST'])
@login_required
def add_request():
    add_request_form = AddRequestForm()
    if request.method == 'POST':
        if add_request_form.validate_on_submit():
            description = add_request_form.description.data
            valid, output = chaincode(
                ["addRequest", session['email_id'], description, session['type']])
            if valid:
                if output.get('message') == 'success':
                    request_key = output.get('response')
                    valid2, output2 = chaincode(
                        ['confirmRequest', session['email_id'], request_key])
                    if valid2:
                        if output2.get('message') == 'success':
                            flash("Request Added Successfully", "success")
                            return redirect(url_for('display_requests'))
                        else:
                            flash(f"{output2.get('error')}", "danger")
                    else:
                        flash("Something went wrong. Please try again.", "danger")
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
    filter_confirmed_requests_form = FilterConfirmedRequestsForm()
    filter_unconfirmed_requests_form = FilterUnconfirmedRequestsForm()

    if request.method == 'POST' and 'confirmed_requests' in request.form:
        if filter_confirmed_requests_form.validate_on_submit():
            valid, output = chaincode(
                ["queryRequests", session['email_id'], "true", session['type']])
            if valid:
                if output.get('message') == 'success':
                    print('___________________________________________________________')
                    print(output)
                    return render_template("display_requests.html", requests=output.get('response'), filter = 'Confirmed', filter_confirmed_requests_form=filter_confirmed_requests_form, filter_unconfirmed_requests_form=filter_unconfirmed_requests_form, confirm_request_form=confirm_request_form)
                else:
                    flash(f"{output.get('error')}", "danger")
            else:
                flash("Something went wrong. Please try again.", "danger")
            return redirect(url_for('display_requests'))

    if request.method == 'POST' and 'unconfirmed_requests' in request.form:
        if filter_unconfirmed_requests_form.validate_on_submit():
            valid, output = chaincode(
                ["queryRequests", session['email_id'], "false", session['type']])

            if valid:
                if output.get('message') == 'success':
                    print('___________________________________________________________')
                    print(output)
                    return render_template("display_requests.html", requests=output.get('response'), filter = 'Unconfirmed', filter_confirmed_requests_form=filter_confirmed_requests_form, filter_unconfirmed_requests_form=filter_unconfirmed_requests_form, confirm_request_form=confirm_request_form)
                else:
                    flash(f"{output.get('error')}", "danger")
            else:
                flash("Something went wrong. Please try again.", "danger")
            return redirect(url_for('display_requests'))

    valid, output = chaincode(
        ["queryRequests", session['email_id'], 'all', session['type']])

    if valid:
        if output.get('message') == 'success':
            print('___________________________________________________________')
            print(output)
            return render_template("display_requests.html", requests=output.get('response'), filter_confirmed_requests_form=filter_confirmed_requests_form, filter_unconfirmed_requests_form=filter_unconfirmed_requests_form, confirm_request_form=confirm_request_form, filter='All')
        else:
            flash(f"{output.get('error')}", "danger")
    else:
        flash("Something went wrong. Please try again.", "danger")
    return redirect(url_for('display_requests'))


@app.route('/confirm_request', methods=['POST'])
def confirm_request():
    confirm_request_form = ConfirmRequestForm()
    if request.method == 'POST' and 'confirm' in request.form:
        if confirm_request_form.validate_on_submit():
            request_key = confirm_request_form.request_key.data
            valid, output = chaincode(
                ["confirmRequest", session['email_id'], request_key])
            if valid:
                if output.get('message') == 'success':
                    flash("Request Confirmed!", "success")
                else:
                    flash(f"{output.get('error')}", "danger")
            else:
                flash("Something went wrong. Please try again.", "danger")
            return redirect(request.referrer)


@app.route('/view_history/<string:key>')
@login_required
def view_history(key):
    valid, output = chaincode(
        ['queryRequestHistory', session['email_id'], key])
    if valid:
        if output.get('message') == 'success':
            return render_template("view_history.html", history=output.get('response'), key=key)
        else:
            flash(f"{output.get('error')}", "danger")
    else:
        flash("Something went wrong. Please try again.", "danger")
    return redirect(request.referrer)

    # view_history_form = ViewHistoryForm()
    # if request.method == 'POST':
    #     if view_history_form.validate_on_submit():
    #         request_key = view_history_form.request_key.data
    #         valid, output = chaincode(
    #             ['queryRequestHistory', session['email_id'], request_key])
    #         if valid:
    #             if output.get('message') == 'success':
    #                 return render_template("view_history.html", history=output.get('response'))
    #             else:
    #                 flash(f"{output.get('error')}", "danger")
    #         else:
    #             flash("Something went wrong. Please try again.", "danger")
    #         return redirect(url_for('display_requests'))


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
