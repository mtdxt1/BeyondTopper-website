/* Beyond Topper - Markdown to SEO HTML builder (runs on Netlify deploy). */
var fs = require("fs"), path = require("path");
var SITE = "https://beyondtopper.in";
var CDIR = path.join(__dirname, "content", "blog");
var ODIR = path.join(__dirname, "blog");

function strip(s){ return (s||"").replace(/^["']|["']$/g,"").trim(); }
function esc(s){ return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function fm(raw){
  var m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if(!m) return { data:{}, body:raw };
  var data={}, lines=m[1].split("\n"), cur=null;
  for(var i=0;i<lines.length;i++){
    var line=lines[i], kv=line.match(/^(\w+):\s*(.*)$/);
    if(line.match(/^(\w+):\s*$/) && lines[i+1] && lines[i+1].match(/^\s*-\s/)){
      var key=line.replace(":","").trim(); data[key]=[]; cur=data[key]; continue;
    }
    if(line.match(/^\s*-\s/) && cur){
      var obj={}, f=line.match(/^\s*-\s+(\w+):\s*(.*)$/);
      if(f) obj[f[1]]=strip(f[2]);
      while(lines[i+1] && lines[i+1].match(/^\s{4,}\w+:/)){ i++; var sub=lines[i].match(/^\s+(\w+):\s*(.*)$/); if(sub) obj[sub[1]]=strip(sub[2]); }
      cur.push(obj); continue;
    }
    if(kv){ cur=null; data[kv[1]]=strip(kv[2]); }
  }
  return { data:data, body:m[2] };
}

function md(t){
  var L=t.split("\n"), o=[], inL=false;
  function inl(x){ return x.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" loading="lazy" style="max-width:100%;border-radius:12px">').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>"); }
  for(var i=0;i<L.length;i++){ var x=L[i];
    if(/^\s*[-*]\s+/.test(x)){ if(!inL){o.push("<ul>");inL=true;} o.push("<li>"+inl(x.replace(/^\s*[-*]\s+/,""))+"</li>"); continue; }
    else if(inL){ o.push("</ul>"); inL=false; }
    if(/^###\s+/.test(x)) o.push("<h3>"+inl(x.replace(/^###\s+/,""))+"</h3>");
    else if(/^##?\s+/.test(x)) o.push("<h2>"+inl(x.replace(/^##?\s+/,""))+"</h2>");
    else if(x.trim()==="") o.push("");
    else o.push("<p>"+inl(x)+"</p>");
  }
  if(inL) o.push("</ul>");
  return o.join("\n");
}

function page(d, body){
  var url=SITE+"/blog/"+d.slug;
  var canon=(d.canonical&&d.canonical.length)?d.canonical:url;
  var img=(d.image&&d.image.indexOf("http")===0)?d.image:SITE+(d.image||"/og-image.jpg");
  var faqs=Array.isArray(d.faq)?d.faq:[];
  var g=[
    {"@type":"Article","headline":d.title,"description":d.description,"image":img,"datePublished":d.date,"dateModified":d.date,"author":{"@type":"Person","name":d.author||"Amit Kumar Dixit"},"publisher":{"@type":"Organization","name":"Beyond Topper","logo":{"@type":"ImageObject","url":SITE+"/og-image.jpg"}},"mainEntityOfPage":url},
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":SITE+"/"},{"@type":"ListItem","position":2,"name":"Blog","item":SITE+"/blog"},{"@type":"ListItem","position":3,"name":d.title,"item":url}]}
  ];
  if(faqs.length) g.push({"@type":"FAQPage","mainEntity":faqs.map(function(f){return {"@type":"Question","name":f.question,"acceptedAnswer":{"@type":"Answer","text":f.answer}};})});
  var schema=JSON.stringify({"@context":"https://schema.org","@graph":g});
  var faqH=faqs.length?("<h2>FAQ</h2>"+faqs.map(function(f){return "<h3>"+esc(f.question)+"</h3><p>"+esc(f.answer)+"</p>";}).join("")):"";
  var H="<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\">";
  H+="<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">";
  H+="<title>"+esc(d.title)+"</title>";
  H+="<meta name=\"description\" content=\""+esc(d.description)+"\">";
  H+="<link rel=\"canonical\" href=\""+canon+"\">";
  H+="<meta name=\"robots\" content=\"index, follow, max-image-preview:large\">";
  H+="<meta property=\"og:type\" content=\"article\"><meta property=\"og:title\" content=\""+esc(d.title)+"\">";
  H+="<meta property=\"og:description\" content=\""+esc(d.description)+"\"><meta property=\"og:url\" content=\""+url+"\">";
  H+="<meta property=\"og:image\" content=\""+img+"\"><meta property=\"og:site_name\" content=\"Beyond Topper\">";
  H+="<meta name=\"twitter:card\" content=\"summary_large_image\"><meta name=\"twitter:title\" content=\""+esc(d.title)+"\">";
  H+="<meta name=\"twitter:description\" content=\""+esc(d.description)+"\"><meta name=\"twitter:image\" content=\""+img+"\">";
  H+="<script type=\"application/ld+json\">"+schema+"</script>";
  H+="<style>body{font-family:system-ui,sans-serif;max-width:820px;margin:0 auto;padding:24px 18px;color:#0B1F3A;line-height:1.7}h1{font-size:2rem}a{color:#00B4D8}img{max-width:100%}.bt-funnel a{display:inline-block;font-size:.82rem;font-weight:600;color:#0B1F3A;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:50px;padding:6px 14px;text-decoration:none;margin:3px}.bt-cta{text-align:center;background:#0B1F3A;color:#fff;padding:20px;border-radius:16px;margin:28px 0}.bt-cta a{display:inline-block;margin:6px;padding:11px 22px;border-radius:50px;text-decoration:none;font-weight:700}</style>";
  H+="</head><body>";
  H+="<nav aria-label=\"breadcrumb\"><a href=\""+SITE+"/\">Home</a> &rsaquo; <a href=\""+SITE+"/blog\">Blog</a> &rsaquo; "+esc(d.title)+"</nav>";
  H+="<nav class=\"bt-funnel\"><a href=\""+SITE+"/#programs\">Courses</a><a href=\""+SITE+"/#resources\">Free Resources</a><a href=\""+SITE+"/#fcta\">Contact</a><a href=\""+SITE+"/#demo\" style=\"background:linear-gradient(135deg,#FFD60A,#FFA500)\">Book Free Demo</a></nav>";
  H+="<h1>"+esc(d.title)+"</h1><p><em>By "+esc(d.author||"Amit Dixit Sir")+", Beyond Topper</em></p>";
  H+=body+faqH;
  H+="<div class=\"bt-cta\"><strong style=\"color:#FFD60A\">Book a Free Demo Class with Amit Dixit Sir</strong><br>";
  H+="<a href=\"https://wa.me/message/IFDJXFQPYEKGI1\" style=\"background:#25D366;color:#fff\">WhatsApp</a>";
  H+="<a href=\"https://www.youtube.com/@beyondTopper\" style=\"background:#FF0000;color:#fff\">YouTube</a></div>";
  H+="</body></html>";
  return H;
}

if(!fs.existsSync(CDIR)){ console.log("No content/blog; nothing to build."); process.exit(0); }
if(!fs.existsSync(ODIR)) fs.mkdirSync(ODIR,{recursive:true});
var files=fs.readdirSync(CDIR).filter(function(f){return f.endsWith(".md");});
var n=0;
for(var i=0;i<files.length;i++){
  var p=fm(fs.readFileSync(path.join(CDIR,files[i]),"utf8"));
  if(!p.data.slug){ console.warn("Skip (no slug):",files[i]); continue; }
  fs.writeFileSync(path.join(ODIR,p.data.slug+".html"), page(p.data, md(p.body)), "utf8");
  console.log("Built:", p.data.slug+".html"); n++;
}
console.log("Build complete. "+n+" post(s).");
