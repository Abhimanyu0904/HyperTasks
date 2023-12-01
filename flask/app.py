from flask import render_template, url_for, redirect, flash, request, session
# from project1 import db, app, bcrypt, images
from forms import *
# from .models import *
# from flask_login import login_user, current_user, logout_user, login_required


"""
Application code
"""
########## IMPORTS ##########
import os
import subprocess
from typing import List

from flask import Flask

########## GLOBAL VARIABLES ##########
app = Flask(__name__)

app.config['SECRET_KEY'] = "feedback"

########## CHAINCODE PROCESSOR ##########
def chaincode(args: List[str]):
    """
    Execute the given chaincode
    """
    out: None | str = None
    valid: bool = False

    # node + invoke/query + chaincode + required arguments for chaincode
    args = ["node"] +\
        [os.path.join("..", "hyperledger", "feedback", "javascript", args[0])] +\
        args[1:]

    try:
        out = subprocess.check_output(args).decode()
        # TODO: parse output as required
        valid = True

    except Exception as e:
        app.logger.error("Something went wrong: %s", e)
        valid = False

    return valid, out

@app.route("/")
@app.route("/home")
def home():
    return render_template('home.html')

@app.route("/user_auth")
def user_auth():
    return render_template('user_auth.html')

@app.route("/register", methods = ['GET', 'POST'])
def register():
    registration_form = RegistrationForm()
    if registration_form.validate_on_submit():
        return render_template("register.html",form=registration_form)
    return render_template("register.html",form=registration_form)

@app.route("/login", methods = ['GET', 'POST'])
def login():
    login_form = LoginForm()
    if login_form.validate_on_submit():
        return render_template("login.html",form=login_form)
    return render_template("login.html",form=login_form)


@app.route("/admin_login", methods = ['GET', 'POST'])
def admin_login():
    admin_login_form = AdminLoginForm()
    if admin_login_form.validate_on_submit():
        return render_template("admin_login.html",form=admin_login_form)
    return render_template("admin_login.html",form=admin_login_form)


# ########## AUTHENTICATION ##########
# @app.get("/signup")
# def get_signup():
#     """
#     Signup page
#     """


# @app.post("/signup")
# def post_signup():
#     """
#     Process signup details
#     """


# @app.get("/signin")
# def get_signin():
#     """
#     Signin page
#     """


# @app.post("/signin")
# def post_signin():
#     """
#     Process signin details
#     """


# @app.post("/signout")
# def signout():
#     """
#     Process user signout
#     """
if __name__ == '__main__':
    app.run(debug=True, port = 5001)