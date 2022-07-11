---
title: RouterSpace Writeup
date: 2022-07-11T12:00:00-00:00
categories:
  - CTF Writeups
excerpt: "RouterSpace is an easy machine on Hack the Box"
header:
  teaser: "/assets/RouterSpace-20220711-infocard.png"
tags:
  - CTF
  - WriteUp
toc: false
toc_label: ""
toc_sticky: true
---

![]({{ site.url }}{{ site.baseurl }}/assets/routerspace/RouterSpace-20220711-infocard.png)

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
|_http-trane-info: Problem with XML parsing of /evox/about
|_http-title: RouterSpace
| fingerprint-strings: 
|   FourOhFourRequest: 
|     HTTP/1.1 200 OK
|     X-Powered-By: RouterSpace
|     X-Cdn: RouterSpace-16039
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 73
|     ETag: W/"49-IwLi6cpjw6cEfY2GCFokDC4yPXw"
|     Date: Tue, 28 Jun 2022 15:59:35 GMT
|     Connection: close
|     Suspicious activity detected !!! {RequestID: sGB9 cHW3 0C wYIu }
|   GetRequest: 
|     HTTP/1.1 200 OK
|     X-Powered-By: RouterSpace
|     X-Cdn: RouterSpace-7090
|     Accept-Ranges: bytes
|     Cache-Control: public, max-age=0
|     Last-Modified: Mon, 22 Nov 2021 11:33:57 GMT
|     ETag: W/"652c-17d476c9285"
|     Content-Type: text/html; charset=UTF-8
|     Content-Length: 25900
|     Date: Tue, 28 Jun 2022 15:59:34 GMT
|     Connection: close
|     <!doctype html>
|     <html class="no-js" lang="zxx">
|     <head>
|     <meta charset="utf-8">
|     <meta http-equiv="x-ua-compatible" content="ie=edge">
|     <title>RouterSpace</title>
|     <meta name="description" content="">
|     <meta name="viewport" content="width=device-width, initial-scale=1">
|     <link rel="stylesheet" href="css/bootstrap.min.css">
|     <link rel="stylesheet" href="css/owl.carousel.min.css">
|     <link rel="stylesheet" href="css/magnific-popup.css">
|     <link rel="stylesheet" href="css/font-awesome.min.css">
|     <link rel="stylesheet" href="css/themify-icons.css">
|   HTTPOptions: 
|     HTTP/1.1 200 OK
|     X-Powered-By: RouterSpace
|     X-Cdn: RouterSpace-14069
|     Allow: GET,HEAD,POST
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 13
|     ETag: W/"d-bMedpZYGrVt1nR4x+qdNZ2GqyRo"
|     Date: Tue, 28 Jun 2022 15:59:34 GMT
|     Connection: close
|     GET,HEAD,POST
|   RTSPRequest, X11Probe: 
|     HTTP/1.1 400 Bad Request
|_    Connection: close
2 services unrecognized despite returning data. If you know the service/version, please submit the following fingerprints at https://nmap.org/cgi-bin/submit.cgi?new-service :
==============NEXT SERVICE FINGERPRINT (SUBMIT INDIVIDUALLY)==============
SF-Port22-TCP:V=7.92%I=7%D=6/28%Time=62BB2566%P=x86_64-pc-linux-gnu%r(NULL
SF:,29,"SSH-2\.0-RouterSpace\x20Packet\x20Filtering\x20V1\r\n");
==============NEXT SERVICE FINGERPRINT (SUBMIT INDIVIDUALLY)==============
SF-Port80-TCP:V=7.92%I=7%D=6/28%Time=62BB2566%P=x86_64-pc-linux-gnu%r(GetR
SF:equest,1F86,"HTTP/1\.1\x20200\x20OK\r\nX-Powered-By:\x20RouterSpace\r\n
SF:X-Cdn:\x20RouterSpace-7090\r\nAccept-Ranges:\x20bytes\r\nCache-Control:
SF:\x20public,\x20max-age=0\r\nLast-Modified:\x20Mon,\x2022\x20Nov\x202021
SF:\x2011:33:57\x20GMT\r\nETag:\x20W/\"652c-17d476c9285\"\r\nContent-Type:
SF:\x20text/html;\x20charset=UTF-8\r\nContent-Length:\x2025900\r\nDate:\x2
SF:0Tue,\x2028\x20Jun\x202022\x2015:59:34\x20GMT\r\nConnection:\x20close\r
SF:\n\r\n<!doctype\x20html>\n<html\x20class=\"no-js\"\x20lang=\"zxx\">\n<h
SF:ead>\n\x20\x20\x20\x20<meta\x20charset=\"utf-8\">\n\x20\x20\x20\x20<met
SF:a\x20http-equiv=\"x-ua-compatible\"\x20content=\"ie=edge\">\n\x20\x20\x
SF:20\x20<title>RouterSpace</title>\n\x20\x20\x20\x20<meta\x20name=\"descr
SF:iption\"\x20content=\"\">\n\x20\x20\x20\x20<meta\x20name=\"viewport\"\x
SF:20content=\"width=device-width,\x20initial-scale=1\">\n\n\x20\x20\x20\x
SF:20<link\x20rel=\"stylesheet\"\x20href=\"css/bootstrap\.min\.css\">\n\x2
SF:0\x20\x20\x20<link\x20rel=\"stylesheet\"\x20href=\"css/owl\.carousel\.m
SF:in\.css\">\n\x20\x20\x20\x20<link\x20rel=\"stylesheet\"\x20href=\"css/m
SF:agnific-popup\.css\">\n\x20\x20\x20\x20<link\x20rel=\"stylesheet\"\x20h
SF:ref=\"css/font-awesome\.min\.css\">\n\x20\x20\x20\x20<link\x20rel=\"sty
SF:lesheet\"\x20href=\"css/themify-icons\.css\">\n\x20\x20")%r(HTTPOptions
SF:,108,"HTTP/1\.1\x20200\x20OK\r\nX-Powered-By:\x20RouterSpace\r\nX-Cdn:\
SF:x20RouterSpace-14069\r\nAllow:\x20GET,HEAD,POST\r\nContent-Type:\x20tex
SF:t/html;\x20charset=utf-8\r\nContent-Length:\x2013\r\nETag:\x20W/\"d-bMe
SF:dpZYGrVt1nR4x\+qdNZ2GqyRo\"\r\nDate:\x20Tue,\x2028\x20Jun\x202022\x2015
SF::59:34\x20GMT\r\nConnection:\x20close\r\n\r\nGET,HEAD,POST")%r(RTSPRequ
SF:est,2F,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nConnection:\x20close\r\n\
SF:r\n")%r(X11Probe,2F,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nConnection:\
SF:x20close\r\n\r\n")%r(FourOhFourRequest,12F,"HTTP/1\.1\x20200\x20OK\r\nX
SF:-Powered-By:\x20RouterSpace\r\nX-Cdn:\x20RouterSpace-16039\r\nContent-T
SF:ype:\x20text/html;\x20charset=utf-8\r\nContent-Length:\x2073\r\nETag:\x
SF:20W/\"49-IwLi6cpjw6cEfY2GCFokDC4yPXw\"\r\nDate:\x20Tue,\x2028\x20Jun\x2
SF:02022\x2015:59:35\x20GMT\r\nConnection:\x20close\r\n\r\nSuspicious\x20a
SF:ctivity\x20detected\x20!!!\x20{RequestID:\x20\x20sGB9\x20\x20cHW3\x200C
SF:\x20\x20wYIu\x20}\n\n\n\n\n\n");

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Tue Jun 28 11:59:49 2022 -- 1 IP address (1 host up) scanned in 31.13 seconds

```

There is a website running on port 80. There isnt much on the site other than a download link.

![]({{ site.url }}{{ site.baseurl }}/assets/routerspace/RouterSpace-20220711-website.png)

The download is an apk file, RouterSpace.apk.

I tried running some tools on the apk but couldnt find anything interesting. 

To run the apk I use Genymotion, an android emulator.


## Exploit
I install the apk in the emulated andoid. I can then intercept HTTP requests from the app using burp. Wifi - Manual - Proxy in android. Change listening interface in burp.

The app has only one button - "Check Status"

![]({{ site.url }}{{ site.baseurl }}/assets/routerspace/RouterSpace-20220711-app.png)

Clicking this button sends the following HTTP request:

![]({{ site.url }}{{ site.baseurl }}/assets/routerspace/RouterSpace-20220711-app-request.png)

I send the request to repeater and start to mess with different inputs.

The "ip" parameter is vulnerable to command injection.

![]({{ site.url }}{{ site.baseurl }}/assets/routerspace/RouterSpace-20220711-app-command-injection.png)



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
