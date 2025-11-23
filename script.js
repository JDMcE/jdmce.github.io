document.addEventListener('DOMContentLoaded', () => {
    const postListElement = document.getElementById('post-list');
    const articleContainer = document.getElementById('article-container');
    const aboutLink = document.getElementById('about-link');
    
    // Store posts globally so the router can access them later
    let globalPosts = [];

    // ==========================================
    // 1. INITIALIZATION & ROUTING
    // ==========================================

    // Fetch the list of posts
    fetch('posts.json')
        .then(response => response.json())
        .then(posts => {
            globalPosts = posts;

            // A. Build the Sidebar Navigation
            posts.forEach((post) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                // Set href to hash (e.g., #wifi-hacking)
                a.href = `#${post.id}`; 
                a.id = `link-${post.id}`; // Add ID for active state styling
                a.innerHTML = `${post.title} <span class="date">${post.date}</span>`;
                
                li.appendChild(a);
                postListElement.appendChild(li);
            });

            // B. Trigger initial route (what happens when page first loads)
            handleRouting();
        })
        .catch(error => console.error('Error loading manifest:', error));

    // Listen for URL Hash Changes (Back/Forward button support)
    window.addEventListener('hashchange', handleRouting);

    // The Main Router Logic
    function handleRouting() {
        // Get the hash (remove the # symbol)
        const hash = window.location.hash.replace('#', '');

        // Clear all active states
        document.querySelectorAll('nav a, #about-link').forEach(el => el.classList.remove('active'));

        if (hash === 'about') {
            // --- CASE 1: About Page ---
            loadPost('posts/about.md');
            if(aboutLink) aboutLink.classList.add('active');
        
        } else if (hash) {
            // --- CASE 2: Specific Blog Post ---
            const post = globalPosts.find(p => p.id === hash);
            
            if (post) {
                loadPost(post.file);
                // Highlight the sidebar link
                const activeLink = document.getElementById(`link-${post.id}`);
                if (activeLink) activeLink.classList.add('active');
            } else {
                articleContainer.innerHTML = `<p style="color:red">Error 404: Segment not found.</p>`;
            }
            
        } else {
            // --- CASE 3: Home / No Hash ---
            articleContainer.innerHTML = `
                <div class="intro">
                    <h2>> System Ready...</h2>
                    <p>&gt;&gt;&gt;</p>
                    <p>&gt;&gt;&gt;</p>
                    <p>&gt;&gt;&gt;</p>
                </div>`;
        }
    }

    // ==========================================
    // 2. CONTENT LOADING & PARSING
    // ==========================================

    function loadPost(filePath) {
        // Show loading state
        articleContainer.innerHTML = '<p class="intro">Scanning data blocks...</p>';
        
        fetch(filePath)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(markdown => {
                // A. Convert Markdown to HTML
                articleContainer.innerHTML = marked.parse(markdown);
                
                // B. Apply Syntax Highlighting (Highlight.js)
                hljs.highlightAll(); 
                
                // C. Add Copy Buttons to Code Blocks
                addCopyButtons();

                // D. Scroll to top of article
                document.getElementById('main-content').scrollTop = 0;
            })
            .catch(error => {
                articleContainer.innerHTML = `<p style="color:red">Error loading file: ${error.message}</p>`;
            });
    }

    // ==========================================
    // 3. UTILITIES (Copy Button)
    // ==========================================

    function addCopyButtons() {
            document.querySelectorAll('pre').forEach(preBlock => {
                // 1. Prevent duplicate buttons
                if (preBlock.querySelector('.copy-btn')) return;

                // 2. SAFETY CHECK: Does this PRE block actually contain CODE?
                const codeElement = preBlock.querySelector('code');
                if (!codeElement) {
                    return; // If no code tag, skip this block (fixes your error)
                }

                // 3. Create the button
                const button = document.createElement('button');
                button.className = 'copy-btn';
                button.innerText = '[ COPY ]';

                button.addEventListener('click', () => {
                    // Get text from the safely found codeElement
                    // We use textContent here as it is often more accurate for code
                    const code = codeElement.textContent; 

                    navigator.clipboard.writeText(code).then(() => {
                        button.innerText = '[ COPIED ]';
                        button.style.color = '#00ff41';
                        
                        setTimeout(() => {
                            button.innerText = '[ COPY ]';
                            button.style.color = ''; 
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy:', err);
                        button.innerText = '[ ERROR ]';
                    });
                });

                // 4. Append button
                preBlock.appendChild(button);
            });
        }
});
