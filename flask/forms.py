from flask_wtf import FlaskForm
from wtforms.validators import NumberRange,DataRequired, EqualTo, Email,Length, Regexp
from wtforms import StringField, PasswordField, SubmitField, BooleanField, SelectField, FloatField, FileField, DateField, IntegerField, HiddenField, TextAreaField
from wtforms_sqlalchemy.fields import QuerySelectField
# from .models import *
# from flask_uploads import UploadSet, IMAGES
# from flask_wtf.file import FileField, FileAllowed

class AdminLoginForm(FlaskForm):
    password = PasswordField('Password', validators= [DataRequired()], render_kw={"placeholder": "Password"})
    submit = SubmitField('Sign In!')

class RegistrationForm(FlaskForm):
    ashokaid = name = StringField('Ashoka ID', validators=[DataRequired(), Regexp('^\d{10}$', message='Ashoka ID must be 10 digits')], render_kw={"placeholder": "Enter Ashoka ID"})
    email_id = StringField('Email', validators=[DataRequired(), Email(message='Please enter a valid email')], render_kw={"placeholder": "Enter email"})
    name = StringField('Name', validators=[DataRequired(), Length(min = 3, max = 50)], render_kw={"placeholder": "Enter Name"})
    password = PasswordField('Password', validators= [DataRequired()], render_kw={"placeholder": "Password"})
    confirm_password = PasswordField('Confirm Password', validators= [DataRequired(), EqualTo('password')], render_kw={"placeholder": "Confirm Password"})
    type = SelectField('Type', choices=[('faculty', 'Faculty'), ('student', 'Student')], validators=[DataRequired()])
    submit = SubmitField('Sign Up!')

class LoginForm(FlaskForm):
    email_id = StringField('Email', validators=[DataRequired(), Email(message='Please enter a valid email')], render_kw={"placeholder": "Enter email"})
    password = PasswordField('Password', validators= [DataRequired()], render_kw={"placeholder": "Password"})
    type = SelectField('Type', choices=[('faculty', 'Faculty'), ('student', 'Student')], validators=[DataRequired()])
    login = SubmitField('Sign In!')

class AddRequestForm(FlaskForm):
    description = TextAreaField('Description', validators=[DataRequired(), Length(min = 5, max = 100)], render_kw={"placeholder": "Enter Request"})
    submit = SubmitField('Submit')

class ConfirmRequestForm(FlaskForm):
    request_key = HiddenField("Request Key", validators=[DataRequired()])
    confirm = SubmitField('Confirm')

class FilterConfirmedRequestsForm(FlaskForm):
    confirmed_requests = SubmitField('Confirmed Requests')

class FilterUnconfirmedRequestsForm(FlaskForm):
    unconfirmed_requests = SubmitField('Unconfirmed Requests')

class ViewHistoryForm(FlaskForm):
    request_key = HiddenField("Request Key", validators=[DataRequired()])
    view_history = SubmitField('View History')

class AcceptUserRegistrationRequestForm(FlaskForm):
    email_id = HiddenField("Email Id", validators=[DataRequired()])
    accept = SubmitField('Accept')

class RejectUserRegistrationRequestForm(FlaskForm):
    email_id = HiddenField("Email Id", validators=[DataRequired()])
    reject = SubmitField('Reject')

class InitiateRequestForm(FlaskForm):
    request_key = HiddenField("Request Key", validators=[DataRequired()])
    initiate = SubmitField('Initiate')

class HoldRequestForm(FlaskForm):
    request_key = HiddenField("Request Key", validators=[DataRequired()])
    put_on_hold = SubmitField('Put On Hold')

class ResumeRequestForm(FlaskForm):
    request_key = HiddenField("Request Key", validators=[DataRequired()])
    resume = SubmitField('Resume')

class FinishRequestForm(FlaskForm):
    request_key = HiddenField("Request Key", validators=[DataRequired()])
    finish = SubmitField('Finish')

class DropRequestForm(FlaskForm):
    request_key = HiddenField("Request Key", validators=[DataRequired()])
    drop = SubmitField('Drop')

class FilterStudentRequestsForm(FlaskForm):
    student_requests = SubmitField('Student Requests')

class FilterFacultyRequestsForm(FlaskForm):
    faculty_requests = SubmitField('Faculty Requests')