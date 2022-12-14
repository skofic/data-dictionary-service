# Data Dictionary Service

This repository contains the [ArangoDB](https://www.arangodb.com) [Foxx micro service](https://www.arangodb.com/docs/stable/foxx.html) to manage and use the data dictionary.

## Installation

1. You must first either install [ArangoDB](https://www.arangodb.com), or have an existing database available.
2. Create a database, any name will do.
3. *Add service* to the database. The best way is to select the GitHub tab and enter `skofic/data-dictionary-service` in the *Repository* field, and `main` in the *Version* field. The *Mount point* can be any string. Turn on *Run* setup flag.
4. Load the dictionary terms. To load the database with some standards you can go to the Data Dictionary Management [GitHub repository](https://github.com/skofic/data-dictionary-management). Follow the instructions and you will have a working data dictionary.

## Documentation

There is not yet definitive documentation available, but you can go to **[this](https://github.com/skofic/data-dictionary-management/blob/main/docs/README.md)** page to have an idea of the principles and ideas behind this data dictionary.

## Services

The service settings contain the default values for a set of environment variables, as well as the collection names and default user code and password.

The services are divided into sections:

### Authentication

This set of services can be used to create and manage users and their authentication.

Users have the following properties:

- `username`: The user code or name, must be unique.
- `role`: An array of terms that define what a user can do. Any string can do, bu these are the terms that the system currently handles:
    - `admin`: The user can create and manage users and consult session information.
    - `dict`: The user can create and manage data dictionary items.
    - `read`: The user can use the data dictionary, but he/she cannot change its elements.

The database will be initialised with a default *administrator* user whose credentials can be found in the service settings tab. The default password is "`secret`", so it is a good idea to change it as soon as possible. To do so:

1. From the service *API* tab *login* (`/auth/login`) as the default administrator with `admin` as the username and `secret` as the password.
2. Go to the *settings* tab in the service. Update the *password* (`adminPass`), optionally you can also change the *username* (`adminCode`).
3. Go back to the service *API* tab and execute the *Reset users* (`/auth/reset`) service setting the `default` parameter to `true`.
4. From the service *API* tab *login* (`/auth/login`) again as the default administrator with the new password and eventual username.

This way you will have an administrator with a safer password. This administrator comes by default with only the `admin` role, which means the only operations this user can do is manage users. So the next thing to do is to create new users that can *use* and *manage* the data dictionary.

*Note that the roles are not cumulative: the `dict` role allows to create dictionary terms and relationships, but it doesn't imply the `read` role that allows reading the dictionary.*

### Administration utilities

-- IN PROGRESS --

### Enumerated types

-- IN PROGRESS --

### Structured types

-- IN PROGRESS --

### Validation services

-- IN PROGRESS --

## The data dictionary

The dictionary is under development, there is not yet public documentation on *what it does*, *how to use it* and the business logic to make it useful, this will come in time and will be integrated into the [FORGENIUS](https://www.forgenius.eu) project.

Stay tuned...
