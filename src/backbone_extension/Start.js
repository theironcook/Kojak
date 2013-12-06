
// A simple extension to Kojak to provide utility to Backbone applications

if(!Kojak){
    throw 'Please include Kojak first';
}

Kojak.Backbone = {};

// Convenience shortcuts if there are no conflicts
// Do not use these in code - just a convenience for typing in the console
if(!window.kBBRep){
    window.kBBRep = Kojak.Backbone.Report;
}
else {
    console.log('Warning, the window.kBBRep variable already existed.  Kojak shortcut will not exist.');
}
