# RouterSpace

![](/posts/routerspace_writeup/RouterSpace-20220711-infocard.png)

RouterSpace is an easy machine on Hack the Box

## Enumeration
nmap:
```bash
# Nmap 7.92 scan initiated Tue Jun 28 11:59:18 2022 as: nmap -sC -sV -oN scans/nmap 10.10.11.148
Nmap scan report for 10.10.11.148
Host is up (0.11s latency).
Not shown: 998 filtered tcp ports (no-response)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     (protocol 2.0)
| ssh-hostkey: 
|   3072 f4:e4:c8:0a:a6:af:66:93:af:69:5a:a9:bc:75:f9:0c (RSA)
|   256 7f:05:cd:8c:42:7b:a9:4a:b2:e6:35:2c:c4:59:78:02 (ECDSA)
|_  256 2f:d7:a8:8b:be:2d:10:b0:c9:b4:29:52:a8:94:24:78 (ED25519)
| fingerprint-strings: 
|   NULL: 
|_    SSH-2.0-RouterSpace Packet Filtering V1
80/tcp open  http

...

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Tue Jun 28 11:59:49 2022 -- 1 IP address (1 host up) scanned in 31.13 seconds

```

There is a website running on port 80. There isnt much on the site other than a download link.

![](/posts/routerspace_writeup/RouterSpace-20220711-website.png)

The download is an apk file, RouterSpace.apk.

I tried running some tools on the apk but couldnt find anything interesting. 

To run the apk I use Genymotion, an android emulator.


## Exploit
I install the apk in the emulated andoid. I can then intercept HTTP requests from the app using burp. Wifi - Manual - Proxy in android. Change listening interface in burp.

The app has only one button - "Check Status"

![](/posts/routerspace_writeup/RouterSpace-20220711-app.png)

Clicking this button sends the following HTTP request:

![](/posts/routerspace_writeup/RouterSpace-20220711-app-request.png)

I send the request to repeater and start to mess with different inputs.

The "ip" parameter is vulnerable to command injection.

![](/posts/routerspace_writeup/RouterSpace-20220711-app-command-injection.png)



I generate an ssh key pair and use the command injection to add it to pauls `authorized_keys` file. I can then connect via SSH.


## Priv Esc

Running linpeas.sh suggests that the machine is vulnerable to `CVE-2021-3156`. This is the recent sudoedit vulnerability [](https://www.youtube.com/watch?v=TLa2VqcGGEQ)

[github.com/CptGibbon/CVE-2021-3156](https://github.com/CptGibbon/CVE-2021-3156) 

I copy the contents of this repo to the machine using scp.

Following the steps in the repo we get root!

```bash
paul@routerspace:/dev/shm/CVE-2021-3156$ ./exploit 
# id 
uid=0(root) gid=0(root) groups=0(root),1001(paul)
```
