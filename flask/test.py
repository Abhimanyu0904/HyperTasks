import smtplib


def send_email(to_address, accepted):
    try:
        session = smtplib.SMTP("smtp.gmail.com", 587)
        session.starttls()
        session.login(content[0], content[1])
        if accepted:
            pass
        else:
            pass

        message = "Subject: Welcome to Hyperfunds!\n\nDear "+ recv_addr +",\n\nYou have been successfully registered to Hyperfunds app! Your password is " + pwd + "."
        session.sendmail("Hyperfunds App <hyperfunds.service@gmail.com>", recv_addr, message)
        session.quit()
    except Exception as e:
        print(e)
        return 1