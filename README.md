## cobiss_books

Little program screen-scraping the cobiss website to get the list of books I have borrowed
in my library and warn me if I must return some soon.

Requires typescript. To install:

    npm install
    tsc

Needs a `config.json` with that format:


```json
{
    "smtp": {
        "host": "xxxx",
        "port": xxx,
        "secure": true/false,
        "auth": {
            "user": "user",
            "pass": "password"
        }
    },
    "mailInfo": {
        "from": "email from",
        "to": "email to",
        "subject": "library books to return"
    },
    "cobissCredentials": [
        {"library": "xxx", "username": "xxx", "password": "xxx", "name": "xxxx"},
    ]
}
```

The COBISS 'library' is the first text entry on 
[this page](https://idp.aai.izum.si/simplesaml/module.php/core/loginuserpassorg.php?AuthState=_c5e2a51f7c5b627ea5567bdf77ec75202ecfed1c2e%3Ahttps%3A%2F%2Fidp.aai.izum.si%2Fsimplesaml%2Fsaml2%2Fidp%2FSSOService.php%3Fspentityid%3Dhttp%253A%252F%252Fwopac.cobiss.net%252Fshibboleth%26cookieTime%3D1540528544%26RelayState%3Dss%253Amem%253Add6e184c7062bf4e9299443dfd58fa6306069030e0392053b7b22656a7860a4f).
