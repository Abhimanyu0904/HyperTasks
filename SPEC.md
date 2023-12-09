# Specification Document

This document outlines the functionality of the Feedback Application.

## Chaincode Requirements

### Query Unconfirmed Requests

Fetch all unconfirmed requests of the given user type

### Query Confirmed Requests

Fetch all confirmed requests of the given user type

### Invoke Add User

Create a new user of a given type: student, faculty

#### Model

```json
{
    "ashoka_id": String, // Ashoka ID
    "email": String, // email id (should be Ashoka Email ID)
    "name": String, // user name
    "password": String, // hashed password of the user
    "type": String, // user type: university / student / faculty
    "verified": Boolean, // is the user verified by the university authority
}
```

### Invoke Add Request

Create a new request with the given description and user type. This will also set the required
confirmations for the request based on the current number of total users of that type.

#### Model

```json
{
    "confirmations": Number, // current confirmations
    "confirmed": Boolean, // is it confirmed
    "confirmed_by": {String: Bool}, // a dictionary storing identifiers for who has confirmed this request to avoid double confirmation
    "created_at": Number, // epoch time in milliseconds
    "description": String, // description of the request
    "key": String, // key to fetch this request from the blockchain
    "required_confirmations": Number, // number of required confirmations
    "status": String, // current status of the request: not started (default) / in progress / implemented
    "type": String, // can only be "request"
    "university_notes": String, // notes from the university about the request
    "update_type": String, // what kind of update was just performed
    "updated_at": Number, // epoch time in milliseconds
    "user_type": String, // user type: student / faculty
}
```

### Invoke Confirm Request

Increment the confirmations for the given request ID.

### Invoke Update Request Status

Update the request status of the given request ID. This can be done by the university user type only.

## Website Requirements

### View User Requests

- Page where logged in users can view requests added by other users

- They can add an upvote for the requests they agree with and want to see implemented.

- Show the details of a request:

  - What is the request
  - Number of people who want the change
  - TODO: Add any more as application progresses

### View Confirmed User Requests

- Page where users can see all the confirmed requests that the community has agreed upon.

- Show details of a request:

  - What is the request
  - Number of people who want the change
  - Status of implementation: Not Started, In Progress, Implemented
  - University notes
  - TODO: Add any more as application progresses

### User Authentication

- Sign In a user

- Sign Out a user

- Sign Up a user:

  - A user can be a student, faculty
  - One user type can only view the requests of the same user type, and thus show support for
  requests from the same user type. University type role can only view the confirmed requests for
  both types but not see unconfirmed requests for either type. Only they can update the status of a request.

- TODO: Add any more as application progresses
