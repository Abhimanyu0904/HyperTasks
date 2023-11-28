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


########## CHAINCODE PROCESSOR ##########
def chaincode(args: List[str]):
    """
    Execute the given chaincode
    """
    out: None | str = None
    valid: bool = False

    # node + invoke/query,js + chaincode + required arguments for chaincode
    args = ["node"] +\
        [os.path.join("..", "hyperledger", "feedback", "javascript", args[0])] +\
        args[1:]

    try:
        out = subprocess.check_output(args).decode()
        # TODO: parse output as required
        valid = True
    except Exception:
        valid = False

    return valid, out


########## REQUESTS ##########
@app.get("/")
def index():
    """
    Index page
    """


########## AUTHENTICATION ##########
@app.get("/signup")
def get_signup():
    """
    Signup page
    """


@app.post("/signup")
def post_signup():
    """
    Process signup details
    """


@app.get("/signin")
def get_signin():
    """
    Signin page
    """


@app.post("/signin")
def post_signin():
    """
    Process signin details
    """


@app.post("/signout")
def signout():
    """
    Process user signout
    """
