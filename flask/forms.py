from flask_wtf import FlaskForm
from wtforms.validators import NumberRange,DataRequired, EqualTo, Email,Length, Regexp
from wtforms import StringField, PasswordField, SubmitField, BooleanField, SelectField, FloatField, FileField, DateField, IntegerField, HiddenField
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
    role = SelectField('Role', choices=[('faculty', 'Faculty'), ('student', 'Student')], validators=[DataRequired()])
    submit = SubmitField('Sign Up!')

class LoginForm(FlaskForm):
    email_id = StringField('Email', validators=[DataRequired(), Email(message='Please enter a valid email')], render_kw={"placeholder": "Enter email"})
    password = PasswordField('Password', validators= [DataRequired()], render_kw={"placeholder": "Password"})
    role = SelectField('Role', choices=[('faculty', 'Faculty'), ('student', 'Student')], validators=[DataRequired()])
    submit = SubmitField('Sign In!')

class CreateCategoryForm(FlaskForm):
    category = StringField('Category', validators=[DataRequired(), Length(min = 2, max = 50)], render_kw={"placeholder": "Enter a new category"})
    save = SubmitField('Save')

class RemoveCategoryForm(FlaskForm):
    category = QuerySelectField('Select a Category',query_factory=lambda: Category.query,get_label='name', validators=[DataRequired()], render_kw={"placeholder": "Select a Category!"})
    save = SubmitField('Save')

class AddUnitForm(FlaskForm):
    unit = StringField('Unit', validators=[DataRequired(), Length(min = 1, max = 20)], render_kw={"placeholder": "Enter a new unit"})
    save = SubmitField('Save')

class RemoveUnitForm(FlaskForm):
    unit = QuerySelectField('Select a Unit',query_factory=lambda: Unit.query,get_label='unit', validators=[DataRequired()], render_kw={"placeholder": "Select a Unit!"})
    save = SubmitField('Save')

class AddProductForm(FlaskForm):
    category = QuerySelectField('Select a Category',query_factory=lambda: Category.query,get_label='name', validators=[DataRequired()], render_kw={"placeholder": "Select a Category!"})
    product_name = StringField('Product Name', validators=[DataRequired(), Length(min = 3, max = 50)], render_kw={"placeholder": "Enter Product Name"})
    unit = SelectField('Unit', validators=[DataRequired()], render_kw={"placeholder": "Select Unit"})
    rate_per_unit = FloatField('Rate per unit', validators=[DataRequired(), NumberRange(message="Please enter a non negative price",min=0)], render_kw={"placeholder": "Enter Rate Per Unit"})
    quantity = IntegerField('Quantity', validators = [DataRequired(),NumberRange(message="Please enter a valid quantity",min=1)], render_kw={"placeholder": "Enter Quantity in Stock"})
    # image = FileField('Image', validators=[FileAllowed(images, 'Images only!')], render_kw = {"placeholder": "Select an Image"})
    save = SubmitField('Save')

class UpdateProductForm(FlaskForm):
    product_name = StringField('Product Name', validators=[DataRequired(), Length(min = 3, max = 50)], render_kw={"placeholder": "Enter Product Name"})
    unit = SelectField('Unit', validators=[DataRequired()], render_kw={"placeholder": "Select Unit"})
    rate_per_unit = FloatField('Rate per unit', validators=[DataRequired(),NumberRange(message="Please enter a non negative price",min=0)], render_kw={"placeholder": "Enter Rate Per Unit"})
    quantity = IntegerField('Quantity', validators = [DataRequired(),NumberRange(message="Please enter a valid quantity",min=1)], render_kw={"placeholder": "Enter Quantity in Stock"})
    # image = FileField('Image', validators=[FileAllowed(images, 'Images only!')], render_kw = {"placeholder": "Select an Image"})
    save = SubmitField('Save')

class RemoveProductForm(FlaskForm):
    product_name = QuerySelectField('Select a Product',query_factory=lambda: Products.query,get_label='name', validators=[DataRequired()], render_kw={"placeholder": "Select a product to remove!"})
    unit = QuerySelectField('Select a Unit',query_factory=lambda: Unit.query,get_label='unit', validators=[DataRequired()], render_kw={"placeholder": "Select a unit to remove!"})
    save = SubmitField('Save')

# class RemoveProductUnitForm(FlaskForm):
#     name = HiddenField('Name', validators=[DataRequired()])
#     # unit = QuerySelectField('Select a Product Variant',query_factory=lambda:Products.query, get_label='unit', validators=[DataRequired()], render_kw={"placeholder": "Select which product variant to remove!"})
#     unit = SelectField('Unit', validators=[DataRequired()])
#     save = SubmitField('Save')

class AddToCartForm(FlaskForm):
    id = HiddenField("Id", validators=[DataRequired()])
    product_name = HiddenField("Product Name", validators=[DataRequired()])
    quantity = IntegerField("Quantity",validators=[DataRequired('Choose some quantity'), NumberRange(message = "Please enter a valid quantity",min=1, max =6)], render_kw={"placeholder": "Enter Number of Products"}, default = None)
    add_to_cart = SubmitField('Add To Cart')

class SearchForm(FlaskForm):
    search_query = StringField('Product Name', validators=[DataRequired(), Length(min = 3, max = 30)], render_kw={"placeholder": "Search for products"})
    search = SubmitField('Search')

class AddOneCartForm(FlaskForm):
    id = HiddenField("Id", validators=[DataRequired()])
    add = SubmitField('+')

class RemoveOneCartForm(FlaskForm):
    id = HiddenField("Id", validators=[DataRequired()])
    remove = SubmitField('-')

class RemoveAllCartForm(FlaskForm):
    id = HiddenField("Id", validators=[DataRequired()])
    remove_all = SubmitField('Remove')

class CheckoutForm(FlaskForm):
    checkout = SubmitField('Checkout')