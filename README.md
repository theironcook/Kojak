##Kojak: A simple JavaScript profiler


###What is Kojak?
Kojak is a simple utility that can help you figure out which of your functions are running too slow. It tracks which of your
functions are called, how often they are called and how much time they are taking.  It can also track your ajax calls
and help figure out how fast they are.


####Why Kojak?  
I've found that Chrome's developer tools or Firebug didn't usually help me figure out where my client side code was slow.
I wanted a tool that would weed out the noise of external / core JavaScript libraries.  Kojak allows you to define what
code you want to examine and it will ignore everything else.  It's really helped me get my client side code faster. Hopefully 
it can help you and your project.

####Dependencies
If you just care about function performance there are no external libraries Kojak uses.  I've worked hard to not use any other 
libraries so that the tool is easy to plugin.  In fact, you can copy the minified code in any browser and start profiling
the runtime of any web site as long as the page uses namespaces (discussed later).
You do need a modern browser.
If you want to profile ajax network requests you will need to include jQuery.

####How to use it
To use Kojak copy/download the Kojak.min.js file.  Include it in the browser you want to profile.  You can include it with 
a <script> tag or copy and paste it in a browser console.



####How to compile it?
* Install NodeJS
* Install GIT
* Fork the code (git clone https://github.com/theironcook/Kojak/)
* Navigate to the directory you forked the code and type: npm install
* From that directory type: grunt buildDev

