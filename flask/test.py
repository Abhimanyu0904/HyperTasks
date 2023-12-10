import smtplib
import ssl
from email.message import EmailMessage

sender = "my_hyperledger_21@hotmail.com"
receiver = "paritoshpanda21@gmail.com"
password = "tudxim-mIbmew-barzo4"
message = "This message is sent from Python."

email = EmailMessage()
email["From"] = sender
email["To"] = receiver
email["Subject"] = "Test Email"
email.set_content(message)

# Create a secure SSL context
context = ssl.create_default_context()

try:
    print("here1")
    server = smtplib.SMTP("smtp-mail.outlook.com", 587)
    print("here2")
    server.starttls(context=context)  # Secure the connection
    print("here3")
    server.login(sender, password)
    print("here4")
    server.sendmail(sender, receiver, email.as_string())

except Exception as e:
    print(e)
finally:
    print("here5")
    server.quit()
