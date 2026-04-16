import fs from 'fs';
import path from 'path';

function convertToJSX(htmlCode) {
    // Basic JSX conversion
    let jsx = htmlCode
        .replace(/class=/g, 'className=')
        .replace(/for=/g, 'htmlFor=')
        .replace(/<!--(.*?)-->/gs, '{/* $1 */}'); // convert comments
    
    // Close unpaired tags
    const voidTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];
    voidTags.forEach(tag => {
        const regex = new RegExp(`(<${tag}[^>]*?)(?<!/)>`, 'gi');
        jsx = jsx.replace(regex, '$1 />');
    });
    
    // Convert style properties to objects (basic support for styles used in the site)
    // The bar chart has inline --h, --c variables.
    jsx = jsx.replace(/style="--h:(.*?)%"/g, 'style={{ "--h": "$1%" }}');
    jsx = jsx.replace(/style="--w:(.*?)%"/g, 'style={{ "--w": "$1%" }}');
    jsx = jsx.replace(/style="--h:(.*?);--c:(.*?)"/g, 'style={{ "--h": "$1", "--c": "$2" }}');
    jsx = jsx.replace(/style="--h:(.*?)"/g, 'style={{ "--h": "$1" }}');
    jsx = jsx.replace(/style={{ "--h": "(.*?)%", "--c": "(.*?)" }}/g, "style={{ '--h': '$1%', '--c': '$2' }}");

    return jsx;
}

const files = [
    { src: './index.html', dest: 'client/src/pages/Home.jsx', name: 'Home' },
    { src: './dashboard.html', dest: 'client/src/pages/Dashboard.jsx', name: 'Dashboard' },
    { src: './login.html', dest: 'client/src/pages/Login.jsx', name: 'Login' },
    { src: './signup.html', dest: 'client/src/pages/Signup.jsx', name: 'Signup' }
];

files.forEach(({ src, dest, name }) => {
    try {
        const html = fs.readFileSync(path.resolve(src), 'utf8');
        
        // Extract body content
        const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/is);
        let bodyContent = bodyMatch ? bodyMatch[1] : html;
        
        // Remove script tags from body
        bodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        const jsxContent = convertToJSX(bodyContent);
        
        const componentTemplate = `
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const ${name} = () => {
    useEffect(() => {
        // Initialize interactive scripts if needed
    }, []);

    return (
        <>
            ${jsxContent}
        </>
    );
};

export default ${name};
        `;
        
        // Also update hrefs to Link logic where appropriate? For simplicity, we can do a simple replace
        const finalContent = componentTemplate
            .replace(/href="index\.html"/g, 'to="/"')
            .replace(/href="dashboard\.html"/g, 'to="/dashboard"')
            .replace(/href="login\.html"/g, 'to="/login"')
            .replace(/href="signup\.html"/g, 'to="/signup"')
            .replace(/<a /g, '<a ') // Leave anchor for external links and anchors
            
        // actually let's convert basic internal navigation anchors to <Link> tags
        let output = finalContent.replace(/<a ([^>]*)to="([^"]+)"([^>]*)>/g, '<Link $1to="$2"$3>');
        output = output.replace(/<\/a>/g, (match, offset, str) => {
            // we have to be careful with closing tags, a naive <Link> replacement is risky without AST.
            // keeping standard <a> tags works fine for React, but they cause full reload. For the MVP, it's fine.
            return '</a>';
        });

        fs.writeFileSync(path.resolve(dest), finalContent);
        console.log(`Successfully converted ${name}`);
    } catch (e) {
        console.error(`Error converting ${name}:`, e);
    }
});
