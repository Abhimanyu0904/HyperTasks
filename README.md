# HyperTasks

HyperTasks is an application designed for students and faculty members of Ashoka University, offering
a new approach to requesting changes and managing those requests. At its core, HyperTasks integrates
the capabilities of Hyperledger Fabric, a permissioned blockchain framework, to elevate the transparency,
security, and efficiency of the feature-request and implementation process.

## How to Run

### Requirements

1. Hyperledger Fabric: https://hyperledger-fabric.readthedocs.io/en/release-2.5/
2. Pipenv: https://pypi.org/project/pipenv/

### Setup Network and Application

```zsh
cd hyperledger/feedback/javascript/
npm install # install node dependencies
cd ..
./networkUp.sh # start network
cd ../../flask
pipenv install # install python dependencies
flask run # run flask app
```

### Shutdown Network

```zsh
cd hyperledger/feedback/
./networkDown.sh
```
