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
