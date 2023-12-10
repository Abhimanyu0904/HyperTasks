import smtplib
import ssl

smtp_server = "smtp.live.com"
port = 587  # For starttls
sender_email = "tashi1714@hotmail.com"
password = "BpzW5dAT4CytXm9"

# Create a secure SSL context
context = ssl.create_default_context()
message = """\
Subject: Hi there

This message is sent from Python."""

try:
    server = smtplib.SMTP(smtp_server, port)
    server.starttls(context=context)  # Secure the connection
    server.login(sender_email, password)
    server.sendmail(sender_email, "paritoshpanda21@gmail.com", message)

except Exception as e:
    print(e)
finally:
    server.quit()
