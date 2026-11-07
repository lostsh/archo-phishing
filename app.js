(function(){
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var root = document.documentElement;
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  /* ---------- aléatoire reproductible ---------- */
  function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function mk(tag, a, parent){ var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; }

  /* ---------- moteur de croquis ---------- */
  function Sketch(g, seed, t0, t1){ this.g = g; this.r = rng(seed); this.t0 = t0 || 0; this.t1 = t1 || 1; this.id = seed; }
  Sketch.prototype.delay = function(){ return this.t0 + this.r() * (this.t1 - this.t0); };
  Sketch.prototype.path = function(d, cls, len, delay){
    var dur = Math.max(.45, Math.min(1.9, (len || 80) / 260));
    return mk("path", { d:d, "class":"pl " + (cls || ""), pathLength:1, style:"--d:" + (delay == null ? this.delay() : delay).toFixed(2) + "s;--dur:" + dur.toFixed(2) + "s" }, this.g);
  };
  /* trait de crayon : léger arc, dépassements aux extrémités, parfois repassé */
  Sketch.prototype.line = function(x1, y1, x2, y2, cls, o){
    o = o || {}; var r = this.r;
    var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    var e1 = o.ext != null ? o.ext : 2 + r() * 9, e2 = o.ext != null ? o.ext : 2 + r() * 9;
    var sx = x1 - ux * e1, sy = y1 - uy * e1, ex = x2 + ux * e2, ey = y2 + uy * e2;
    var bow = (r() - .5) * Math.min(3.2, len * .014);
    var cx = (sx + ex) / 2 + nx * bow, cy = (sy + ey) / 2 + ny * bow;
    var d = "M" + sx.toFixed(1) + " " + sy.toFixed(1) + " Q" + cx.toFixed(1) + " " + cy.toFixed(1) + " " + ex.toFixed(1) + " " + ey.toFixed(1);
    var dl = o.d != null ? o.d : this.delay();
    this.path(d, cls, len, dl);
    if (o.double || (o.double !== false && r() < .32)){
      var off = (r() - .5) * 1.6, a = .05 + r() * .25, b = .7 + r() * .3;
      var px1 = x1 + dx * a + nx * off, py1 = y1 + dy * a + ny * off, px2 = x1 + dx * b + nx * off, py2 = y1 + dy * b + ny * off;
      this.path("M" + px1.toFixed(1) + " " + py1.toFixed(1) + " L" + px2.toFixed(1) + " " + py2.toFixed(1), (cls || "") + " f", len * (b - a), dl + .2);
    }
  };
  Sketch.prototype.poly = function(pts, cls, o){ for (var i = 0; i < pts.length - 1; i++) this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], cls, o); };
  /* hachures dans un polygone */
  Sketch.prototype.hatch = function(pts, angle, gap, cls, o){
    o = o || {}; var r = this.r, id = "hc" + this.id + "_" + Math.floor(r() * 1e9);
    var cp = mk("clipPath", { id:id }, this.g); mk("polygon", { points:pts.map(function(p){ return p.join(","); }).join(" ") }, cp);
    var hg = mk("g", { "clip-path":"url(#" + id + ")" }, this.g);
    var xs = pts.map(function(p){ return p[0]; }), ys = pts.map(function(p){ return p[1]; });
    var minx = Math.min.apply(0, xs), maxx = Math.max.apply(0, xs), miny = Math.min.apply(0, ys), maxy = Math.max.apply(0, ys);
    var cxm = (minx + maxx) / 2, cym = (miny + maxy) / 2, R = Math.hypot(maxx - minx, maxy - miny) / 2 + 4;
    var a = angle * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
    var saved = this.g; this.g = hg; var base = o.d != null ? o.d : this.delay();
    for (var k = -R, i = 0; k <= R; k += gap * (.8 + r() * .5), i++){
      var mx = cxm + nx * k, my = cym + ny * k;
      this.line(mx - ux * R, my - uy * R, mx + ux * R, my + uy * R, cls || "h", { ext:0, double:false, d:base + i * .03 });
    }
    this.g = saved;
  };
  Sketch.prototype.rect = function(x, y, w, h, cls, o){ this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], cls, o); };
  /* pin élancé, à la manière d'un croquis d'architecte */
  Sketch.prototype.pine = function(x, gy, h, cls){
    var r = this.r, top = gy - h, lean = (r() - .5) * 10;
    this.line(x, gy, x + lean * .4, gy - h * .55, cls, { ext:0, double:false });
    this.line(x + lean * .4, gy - h * .55, x + lean, top, cls, { ext:0, double:false });
    this.line(x + 1.6, gy, x + lean * .4 + 1.2, gy - h * .5, "f", { ext:0, double:false });
    var start = .48 + r() * .12;
    for (var t = start; t < .98; t += .035 + r() * .03){
      var bx = x + lean * t, by = gy - h * t, side = r() < .5 ? -1 : 1, L = (1 - t) * h * (.16 + r() * .14) + 5;
      var ex = bx + side * L, ey = by + L * (.18 + r() * .25);
      this.line(bx, by, ex, ey, "t", { ext:1, double:false });
      var n = 3 + Math.floor(r() * 5);
      for (var j = 0; j < n; j++){
        var px = bx + (ex - bx) * (.35 + r() * .7), py = by + (ey - by) * (.35 + r() * .7) + (r() - .5) * 8, l = 3 + r() * 8, an = (r() - .5) * 1.2 + (side > 0 ? .3 : Math.PI - .3);
        this.line(px, py, px + Math.cos(an) * l, py + Math.sin(an) * l, "f", { ext:0, double:false });
      }
    }
  };

  /* ---------- outils de dessin supplémentaires ---------- */
  /* gribouillis continu : feuillage, massifs */
  Sketch.prototype.scribble = function(cx, cy, rx, ry, n, cls, d){
    var r = this.r, x = cx + (r() - .5) * rx, y = cy + (r() - .5) * ry, ang = r() * 6.28, step = Math.max(1.6, Math.min(rx, ry) * .32);
    var s = "M" + x.toFixed(1) + " " + y.toFixed(1), steps = Math.round(n * 2.2);
    for (var i = 0; i < steps; i++){
      ang += (r() - .5) * 2.4;
      var nx = x + Math.cos(ang) * step, ny = y + Math.sin(ang) * step * .8;
      if (((nx - cx) * (nx - cx)) / (rx * rx) + ((ny - cy) * (ny - cy)) / (ry * ry) > 1){ ang = Math.atan2(cy - y, cx - x) + (r() - .5); nx = x + Math.cos(ang) * step; ny = y + Math.sin(ang) * step * .8; }
      var qx = (x + nx) / 2 + (r() - .5) * step, qy = (y + ny) / 2 + (r() - .5) * step;
      s += " Q" + qx.toFixed(1) + " " + qy.toFixed(1) + " " + nx.toFixed(1) + " " + ny.toFixed(1); x = nx; y = ny;
    }
    this.path(s, cls || "f", steps * step, d);
  };
  /* pin d'architecte : tronc effilé, branches irrégulières, touffes en grappes */
  Sketch.prototype.pine2 = function(x, gy, h, cls, light){
    var r = this.r, lean = (r() - .5) * 8, top = gy - h, c = light ? "f" : (cls || "t");
    this.line(x - 1.6, gy, x + lean - .3, top, c, { ext:0, double:false });
    this.line(x + 1.6, gy, x + lean + .3, top + 8, light ? "f" : "f", { ext:0, double:false });
    var start = .42 + r() * .16;
    for (var t = start; t < .97; t += .045 + r() * .05){
      var bx = x + lean * t, by = gy - h * t, side = r() < .5 ? -1 : 1, L = (1 - t) * h * (.12 + r() * .16) + 6;
      var ex = bx + side * L, ey = by - L * (.05 + r() * .2);
      this.line(bx, by, ex, ey, c, { ext:0, double:false });
      this.scribble(ex - side * L * .3, ey - 2, L * .5 + 5, 4 + r() * 4, 16 + Math.floor(r() * 10), "h");
    }
    this.scribble(x + lean, top + 8, 6, 10, 12, "h");
  };
  /* feuillu en arrière-plan : quelques masses gribouillées */
  Sketch.prototype.tree = function(x, gy, h){
    var r = this.r;
    this.line(x, gy, x + (r() - .5) * 6, gy - h * .55, "f", { ext:0, double:false });
    for (var i = 0; i < 5; i++) this.scribble(x + (r() - .5) * h * .32, gy - h * (.6 + r() * .3), h * (.12 + r() * .08), h * (.09 + r() * .06), 40, "h");
  };
  /* silhouette humaine à l'échelle (remplie, apparaît en fondu) */
  function person(g, x, y, h, walk){
    var u = h / 26, hd = mk("circle", { cx:x, cy:y - 23.5 * u, r:2.3 * u, "class":"fig" }, g);
    var d = "M" + (x - 3.2 * u) + " " + (y - 20 * u) + " L" + (x + 3.2 * u) + " " + (y - 20 * u) + " L" + (x + 2.6 * u) + " " + (y - 10 * u) +
      (walk ? " L" + (x + 4.5 * u) + " " + y + " L" + (x + 2.8 * u) + " " + y + " L" + (x + .2 * u) + " " + (y - 8 * u) + " L" + (x - 2 * u) + " " + y + " L" + (x - 3.8 * u) + " " + y
            : " L" + (x + 2 * u) + " " + y + " L" + (x + .6 * u) + " " + y + " L" + x + " " + (y - 9 * u) + " L" + (x - .6 * u) + " " + y + " L" + (x - 2 * u) + " " + y) +
      " L" + (x - 2.6 * u) + " " + (y - 10 * u) + " Z";
    mk("path", { d:d, "class":"fig" }, g);
  }

  /* ---------- pavillon (héros) ---------- */
  function pavilion(svg){
    var defs = mk("defs", {}, svg);
    var f = mk("filter", { id:"wc", x:"-20%", y:"-20%", width:"140%", height:"140%" }, defs);
    mk("feTurbulence", { type:"fractalNoise", baseFrequency:".011", numOctaves:"3", seed:"7", result:"n" }, f);
    mk("feDisplacementMap", { "in":"SourceGraphic", in2:"n", scale:"70", result:"d" }, f);
    mk("feGaussianBlur", { "in":"d", stdDeviation:"10" }, f);
    function grad(id, x2, y2, stops){ var g = mk("linearGradient", { id:id, x1:"0", y1:"0", x2:x2, y2:y2 }, defs); stops.forEach(function(s){ mk("stop", { offset:s[0], "stop-color":"#fff", "stop-opacity":s[1] }, g); }); }
    grad("fv", "0", "1", [["0","0"],[".22","1"],[".86","1"],["1","0"]]);
    grad("fh", "1", "0", [["0","0"],[".08","1"],[".92","1"],["1","0"]]);
    var mv = mk("mask", { id:"mv", maskUnits:"userSpaceOnUse", x:"0", y:"0", width:"1200", height:"560" }, defs); mk("rect", { x:0, y:0, width:1200, height:560, fill:"url(#fv)" }, mv);
    var mh = mk("mask", { id:"mh", maskUnits:"userSpaceOnUse", x:"0", y:"0", width:"1200", height:"560" }, defs); mk("rect", { x:0, y:0, width:1200, height:560, fill:"url(#fh)" }, mh);
    var outer = mk("g", { mask:"url(#mv)" }, svg), scene = mk("g", { mask:"url(#mh)" }, outer);
    var GY = 470;

    /* lavis */
    var wash = mk("g", { "class":"wash", filter:"url(#wc)" }, scene);
    [["w-grey",150,230,170,110],["w-grey",1060,220,150,100],["w-grey",690,150,130,70],
     ["w-ochre",560,318,210,44],["w-ochre",520,200,70,40],["w-rust",640,462,300,26],["w-rust",330,452,70,24],["w-ochre",960,470,150,16],["w-rust",470,338,46,22]]
      .forEach(function(w){ mk("ellipse", { "class":w[0], cx:w[1], cy:w[2], rx:w[3], ry:w[4] }, wash); });

    var G = mk("g", { "class":"drawn" }, scene);
    var S = function(seed, a, b){ return new Sketch(G, seed, a, b); };

    /* axes de la trame (éléments légers) */
    var ax = S(41, .1, .6);
    var AX = [[372,"A"],[560,"B"],[735,"C"],[885,"D"]];
    AX.forEach(function(p){ ax.line(p[0], 84, p[0], GY + 14, "ax", { ext:0, double:false }); });

    /* arrière-plan : arbres clairs */
    var bg = S(7, .5, 2.6);
    [[40,300],[1160,270]].forEach(function(t){ bg.tree(t[0], GY, t[1]); });
    [[110,330],[262,250],[1110,320]].forEach(function(t){ bg.pine2(t[0], GY, t[1], "f", true); });

    /* sol */
    var gr = S(3, 0, .5);
    gr.line(-40, GY, 1240, GY, "b", { ext:0, double:true });
    gr.line(-20, GY + 7, 1220, GY + 7, "f", { ext:0, double:false });
    for (var gx = 10; gx < 1190; gx += 7 + gr.r() * 16) gr.line(gx, GY + 10, gx - 3, GY + 14 + gr.r() * 8, "h", { ext:0, double:false, d:.4 + gx / 3000 });
    for (var tx = 20; tx < 1180; tx += 30 + gr.r() * 60){ var tu = gr.r() * 4; gr.line(tx, GY, tx - 3, GY - 6 - tu, "f", { ext:0, double:false, d:1.6 }); gr.line(tx + 2, GY, tx + 3, GY - 8 - tu, "f", { ext:0, double:false, d:1.6 }); }

    /* structure */
    var st = S(5, .4, 1.4);
    var berm = [[430,GY],[640,416],[770,416],[860,GY]];
    st.poly(berm, "t"); st.hatch(berm.concat([[430,GY]]), 62, 10, "h", { d:1.4 });
    st.line(340, 380, 905, 380, "b"); st.line(345, 390, 900, 390, "t"); st.hatch([[345,380],[900,380],[900,390],[345,390]], 20, 6, "h", { d:1.3 });
    st.line(296, 245, 944, 245, "b"); st.line(304, 254, 936, 254, "t"); st.hatch([[304,245],[936,245],[936,254],[304,254]], 20, 6, "h", { d:1.3 });
    st.line(440, 142, 604, 142, "b"); st.line(446, 148, 598, 148, "t");
    st.line(340, 380, 340, 390, "t", { ext:1 }); st.line(905, 380, 905, 390, "t", { ext:1 });
    [372,560,735,885].forEach(function(x){ st.line(x - 2, 390, x - 3, GY, "t", { ext:2 }); st.line(x + 3, 390, x + 4, GY, "f", { ext:0, double:false }); });

    /* vitrages, reflets, intérieur */
    var gl = S(9, 1.1, 2.3);
    for (var x = 360; x <= 900; x += 45) gl.line(x, 254, x, 380, "f", { ext:3 });
    gl.rect(452, 148, 140, 97, "t");
    for (var bx = 487; bx < 592; bx += 35) gl.line(bx, 148, bx, 245, "f", { ext:2 });
    [[360,262],[450,262],[630,262],[810,262],[487,156],[855,262]].forEach(function(p){
      for (var k = 0; k < 3; k++){ var o = k * 7 + gl.r() * 3; gl.line(p[0] + 8 + o, p[1] + 30 - o * .2, p[0] + 26 + o, p[1] + 6 - o * .2, "h", { ext:0, double:false }); }
    });
    gl.line(600, 226, 920, 226, "f"); for (var px = 620; px <= 900; px += 40) gl.line(px, 226, px, 245, "f", { ext:0, double:false });
    /* mobilier : table, chaises, canapé, suspension, étagère, plante */
    gl.line(560, 352, 640, 352, "t", { ext:2 }); gl.line(566, 352, 566, 380, "f", { ext:0 }); gl.line(634, 352, 634, 380, "f", { ext:0 });
    [548,652].forEach(function(cx){ gl.line(cx, 362, cx + (cx < 600 ? 10 : -10), 362, "f", { ext:0 }); gl.line(cx, 340, cx, 380, "f", { ext:0, double:false }); });
    gl.line(600, 254, 600, 300, "f", { ext:0, double:false }); gl.line(588, 300, 612, 300, "t", { ext:0 }); gl.line(588, 300, 600, 292, "f", { ext:0 }); gl.line(612, 300, 600, 292, "f", { ext:0 });
    gl.rect(790, 350, 70, 18, "f", { ext:2 }); gl.line(790, 344, 790, 368, "f", { ext:0 });
    gl.rect(380, 290, 30, 90, "f", { ext:2 }); [310,330,350].forEach(function(y){ gl.line(380, y, 410, y, "f", { ext:0 }); });
    gl.scribble(452, 344, 12, 16, 30, "h"); gl.line(452, 360, 452, 380, "f", { ext:0 });
    gl.scribble(520, 134, 16, 8, 26, "h");

    /* escalier */
    var sr = S(13, .9, 1.8);
    sr.line(296, GY, 430, 390, "t", { ext:4 });
    var steps = []; for (var i = 0; i <= 8; i++){ steps.push([296 + i * 16.75, GY - i * 10]); steps.push([296 + (i + 1) * 16.75, GY - i * 10]); }
    sr.poly(steps.slice(0, 16), "f", { ext:0, double:false });
    sr.line(300, GY - 30, 434, 360, "f", { ext:6 });
    sr.hatch([[296,GY],[430,390],[430,GY]], 45, 7, "h", { d:1.7 });

    /* premier plan : pins */
    var trees = S(11, .7, 3.2);
    [[70,350],[190,400],[640,430],[1010,370],[1072,300]].forEach(function(t){ trees.pine2(t[0], GY, t[1], "t"); });

    /* oiseaux */
    var bd = S(19, 2.8, 3.2);
    [[860,96,1],[884,86,.8],[902,104,.7]].forEach(function(b){ var s = 6 * b[2]; bd.line(b[0] - s, b[1] - s * .6, b[0], b[1], "t", { ext:0, double:false }); bd.line(b[0], b[1], b[0] + s, b[1] - s * .7, "t", { ext:0, double:false }); });

    /* personnages */
    var figs = mk("g", { "class":"figs" }, scene);
    person(figs, 505, 380, 26, false); person(figs, 690, 416, 24, true); person(figs, 250, GY, 25, true); person(figs, 780, 226, 23, false);

    /* la travée */
    var bay = mk("g", {}, scene);
    mk("rect", { x:720, y:254, width:45, height:126, "class":"bay-fill wash", filter:"url(#wc)" }, bay);
    var bs = new Sketch(bay, 23, 2.6, 3.0); bay.setAttribute("class", "drawn bay-g"); svg._bay = bay;
    bs.rect(720, 254, 45, 126, "r", { ext:4, double:false });

    /* éléments légers hors masque : bulles d'axes, niveaux */
    var light = mk("g", { "class":"light-g" }, svg);
    AX.forEach(function(p){ mk("circle", { cx:p[0], cy:70, r:11, "class":"bubble" }, light); var t = mk("text", { x:p[0], y:74.5, "text-anchor":"middle", "class":"bubble-t" }, light); t.textContent = p[1]; });
    [[GY,"\u00B10,00"],[380,"+2,90"],[245,"+6,40"]].forEach(function(l){
      var y = l[0], x0 = 1120;
      mk("line", { x1:950, y1:y, x2:x0 + 50, y2:y, "class":"lvl-l" }, light);
      mk("path", { d:"M" + (x0 - 6) + " " + (y - 10) + " L" + (x0 + 6) + " " + (y - 10) + " L" + x0 + " " + y + " Z", "class":"lvl" }, light);
      var t = mk("text", { x:x0 + 12, y:y - 4, "class":"lvl-t" }, light); t.textContent = l[1];
    });

    /* annotations */
    var an = mk("g", { "class":"anno-g" }, svg);
    var as = new Sketch(an, 29, 0, 0);
    as.poly([[742,300],[920,176],[1100,176]], "t", { ext:0, double:false });
    mk("circle", { cx:742, cy:300, r:2.6, "class":"sb-sig" }, an);
    var t1 = mk("text", { x:1100, y:164, "text-anchor":"end", "class":"anno" }, an); t1.textContent = "La travée : tu reprends la main";
    var t2 = mk("text", { x:1100, y:198, "text-anchor":"end", "class":"anno-s" }, an); t2.textContent = "quelques secondes, quelques fois par jour";
    var an2 = mk("g", { "class":"anno-g2" }, svg);
    var as2 = new Sketch(an2, 31, 0, 0);
    as2.poly([[430,300],[300,206],[24,206]], "t", { ext:0, double:false });
    mk("circle", { cx:430, cy:300, r:2.6, "class":"sb-fill" }, an2);
    var t3 = mk("text", { x:24, y:194, "class":"anno" }, an2); t3.textContent = "Le reste : pilote auto";
    var t4 = mk("text", { x:24, y:228, "class":"anno-s" }, an2); t4.textContent = "et c\u2019est très bien comme ça";
    return G;
  }

  /* ---------- échelle graphique : une journée ---------- */
  function scaleBar(){
    var box = document.getElementById("scaleBar"), w = box.clientWidth; if (!w) return;
    box.innerHTML = "";
    var svg = mk("svg", { viewBox:"0 0 " + w + " 46", "aria-hidden":"true" }, box);
    var h0 = 8, h1 = 20, X = function(h){ return (h - h0) / (h1 - h0) * (w - 1) + .5; };
    for (var h = h0; h < h1; h++) mk("rect", { x:X(h), y:14, width:X(h + 1) - X(h), height:5, "class":(h % 2 ? "sb-empty" : "sb-fill") }, svg);
    mk("rect", { x:X(h0), y:14, width:X(h1) - X(h0), height:5, "class":"sb-empty" }, svg);
    var step = w < 520 ? 4 : 2;
    for (var t = h0; t <= h1; t += step){
      mk("line", { x1:X(t), y1:10, x2:X(t), y2:23, "class":"sb-tick" }, svg);
      var tx = mk("text", { x:X(t), y:40, "text-anchor":t === h0 ? "start" : t === h1 ? "end" : "middle", "class":"sb-t" }, svg); tx.textContent = t + "\u00A0h";
    }
    [9.3, 11.7, 14.6, 17.1].forEach(function(t, i){ mk("rect", { x:X(t) - 1.5, y:2, width:3, height:21, "class":"sb-mark", style:"transition-delay:" + (3.6 + i * .25) + "s" }, svg); });
    if (document.querySelector(".plate").classList.contains("go")) svg.classList.add("go");
    box._svg = svg;
  }

  /* ---------- croquis en transparence des sections ---------- */
  var OVERLAYS = {
    axo:function(s){
      s.poly([[110,62],[160,40],[160,262],[110,284],[110,62]], "t");
      s.hatch([[110,62],[160,40],[160,262],[110,284]], 70, 7, "h");
      s.line(20, 102, 350, -44, "f", { ext:10 }); s.line(30, 322, 350, 180, "f", { ext:10 });
      s.line(212, 6, 212, 300, "t", { ext:12 }); s.line(186, 120, 186, 186, "f");
      s.poly([[252,128],[310,102],[310,206],[252,232],[252,128]], "t");
      s.poly([[252,128],[244,122],[302,96],[310,102]], "f"); s.line(244, 122, 244, 226, "f"); s.line(244, 226, 252, 232, "f");
      s.hatch([[252,200],[310,174],[310,206],[252,232]], 64, 5, "h");
      s.line(160, 262, 252, 232, "f", { ext:4 }); s.line(160, 40, 310, -26, "f", { ext:4 });
    },
    wall:function(s){
      s.line(150, 10, 150, 350, "t", { ext:12 }); s.line(178, 10, 178, 350, "t", { ext:12 });
      s.hatch([[150,10],[178,10],[178,350],[150,350]], 60, 6, "h");
      s.line(30, 150, 350, 150, "t", { ext:14 }); s.line(30, 160, 350, 160, "t", { ext:14 });
      s.hatch([[30,150],[150,150],[150,160],[30,160]], 30, 7, "h");
      s.line(178, 100, 270, 100, "t"); s.line(270, 94, 270, 106, "f", { ext:0 });
      s.line(196, 160, 196, 300, "f"); s.line(204, 160, 204, 300, "f");
      s.line(178, 290, 350, 290, "t", { ext:10 }); s.line(178, 300, 350, 300, "t", { ext:10 });
      s.line(20, 172, 20, 240, "f", { ext:0 }); s.line(14, 172, 26, 172, "f", { ext:0 });
    },
    stair:function(s){
      var p = [[30,320]]; for (var i = 0; i < 9; i++){ p.push([30 + i * 32, 320 - (i + 1) * 28]); p.push([30 + (i + 1) * 32, 320 - (i + 1) * 28]); }
      s.poly(p, "t", { double:false });
      s.line(30, 320, 318, 68, "f", { ext:14 }); s.hatch([[30,320],[318,68],[318,330],[30,330]], 45, 8, "h");
      s.line(30, 270, 318, 18, "t", { ext:10 }); for (var k = 0; k < 9; k += 2) s.line(46 + k * 32, 320 - (k + 1) * 28, 46 + k * 32, 270 - (k + .5) * 28, "f", { ext:0 });
    },
    axo2:function(s){
      s.poly([[70,90],[250,40],[330,90],[150,140],[70,90]], "t");
      s.poly([[70,90],[70,250],[150,300],[150,140]], "t"); s.line(150, 300, 330, 250, "t"); s.line(330, 250, 330, 90, "t");
      s.hatch([[70,90],[150,140],[150,300],[70,250]], 80, 7, "h");
      s.line(0, 47, 360, 268, "f", { ext:10 }); s.line(250, 0, 250, 40, "f", { ext:6 });
      s.line(110, 115, 290, 65, "f"); s.line(200, 130, 200, 290, "f");
    },
    wall2:function(s){
      s.line(160, 0, 160, 360, "t", { ext:10 }); s.line(192, 0, 192, 360, "t", { ext:10 });
      s.line(0, 120, 360, 120, "t", { ext:10 }); s.line(0, 144, 360, 144, "t", { ext:10 });
      s.hatch([[160,120],[192,120],[192,144],[160,144]], 45, 3.5, "h");
      s.line(40, 90, 160, 90, "f", { ext:0 }); s.line(40, 84, 40, 96, "f", { ext:0 }); s.line(160, 84, 160, 96, "f", { ext:0 });
      s.line(220, 144, 220, 330, "f"); s.line(230, 144, 230, 330, "f");
    }
  };
  OVERLAYS.frame = function(s){
    s.rect(110, 40, 150, 280, "t"); s.rect(124, 54, 122, 252, "f");
    s.line(20, 320, 350, 320, "t", { ext:14 }); s.line(110, 20, 110, 350, "f", { ext:6 }); s.line(260, 20, 260, 350, "f", { ext:6 });
    s.hatch([[110,40],[124,54],[124,306],[110,320]], 70, 5, "h"); s.line(124, 180, 246, 180, "f");
    s.line(110, 340, 260, 340, "f", { ext:0 }); s.line(110, 334, 110, 346, "f", { ext:0 }); s.line(260, 334, 260, 346, "f", { ext:0 });
  };
  /* ---------- apparitions ---------- */
  document.querySelectorAll(".hero-text .sheet, .hero-text h1, .hero-text .lead").forEach(function(e, i){ e.classList.add("rv"); e.style.setProperty("--rd", (.1 + i * .18) + "s"); });
  document.querySelectorAll(".s").forEach(function(sec){
    var items = sec.querySelectorAll(".s-head h2, .s-head .num, .bays > li, .intro, .cols > div, .rule, .rule-sub, .gest > li, .notes > li, .risks > li, .fix > li, .closing");
    items.forEach(function(e, i){ e.classList.add("rv"); e.style.setProperty("--rd", Math.min(i * .07, .9) + "s"); });
  });
  var pav = pavilion(document.getElementById("pavilion"));
  scaleBar();
  var plate = document.querySelector(".plate");
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ plate.classList.add("go"); pav.classList.add("go"); document.getElementById("pavilion")._bay.classList.add("go"); var sb = document.getElementById("scaleBar")._svg; if (sb) sb.classList.add("go"); }); });
  if ("IntersectionObserver" in window && !REDUCE){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin:"0px 0px -15% 0px" });
    document.querySelectorAll(".s").forEach(function(s){ io.observe(s); });
  } else document.querySelectorAll(".s").forEach(function(s){ s.classList.add("in"); });

  var rt; window.addEventListener("resize", function(){ clearTimeout(rt); rt = setTimeout(function(){ scaleBar(); }, 150); });

  /* ---------- barre de progression ---------- */
  var prog = document.getElementById("prog"), ticking = false;
  function onScroll(){ if (ticking) return; ticking = true; requestAnimationFrame(function(){ var m = document.documentElement.scrollHeight - innerHeight; prog.style.transform = "scaleX(" + (m > 0 ? Math.min(1, scrollY / m) : 0) + ")"; ticking = false; }); }
  window.addEventListener("scroll", onScroll, { passive:true }); onScroll();

  /* ================= BLUEPRINT : un seul grand dessin, on se déplace dedans ================= */
  var BP = (function(){
    var W = 4400, H = 2600;
    /* niveaux du bâtiment */
    var X0 = 300, X1 = 3960, ROOF = 260, UP = 1000, GR = 1700, BS = 2300, BX0 = 1560, BX1 = 2800;
    /* arrêts de la caméra : cam = cadrage, card = où vit le texte */
    var STOPS = [
      { key:"overview", cam:[0, 120, 4400, 2380], side:true, label:"Coupe générale" },
      { key:"s1", cam:[340, 300, 1520, 700], card:[360, 330, 1480, 650], label:"Planche 01, le principe", zone:"z1" },
      { key:"s2", cam:[1880, 300, 1280, 700], card:[1900, 330, 1090, 650], label:"Planche 02, le signal", zone:"z2" },
      { key:"g1", cam:[3180, 600, 780, 430], card:[3220, 640, 380, 340], label:"Planche 03, stop", zone:"z3" },
      { key:"g2", cam:[3180, 1040, 780, 420], card:[3220, 1080, 380, 300], label:"Planche 03, vérifie", zone:"z3" },
      { key:"g3", cam:[3180, 1360, 780, 380], card:[3220, 1400, 380, 280], label:"Planche 03, relâche", zone:"z3" },
      { key:"t1", cam:[2140, 1040, 1020, 680], card:[2160, 1060, 980, 620], label:"Planche 04, ce qu’on sait moins", zone:"z4" },
      { key:"t2", cam:[1160, 1040, 1020, 680], card:[1180, 1060, 980, 620], label:"Planche 04, la suite", zone:"z4" },
      { key:"s5", cam:[1580, 1740, 1200, 580], card:[1600, 1760, 1160, 520], label:"Planche 05, ce que tu risques", zone:"z5" },
      { key:"s6", cam:[320, 1040, 840, 690], card:[340, 1050, 800, 650], label:"Planche 06, la sortie", zone:"z6" },
      { key:"end", cam:[0, 120, 4400, 2380], side:true, label:"Coupe générale" }
    ];
    var built = false, active = false, stage, world, svg, cards = [], hero, mini, miniCam, cap, zones = {}, N = STOPS.length;

    function clean(node){ var c = node.cloneNode(true); c.removeAttribute && c.removeAttribute("id"); c.querySelectorAll("[id]").forEach(function(e){ e.removeAttribute("id"); }); c.querySelectorAll(".rv").forEach(function(e){ e.classList.remove("rv"); }); c.classList && c.classList.remove("rv"); return c; }
    function q(sel){ return document.querySelector(sel); }
    function qa(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

    function card(stop, cls, nodes){
      var d = document.createElement("div"); d.className = "bp-card " + cls;
      var r = stop.card; d.style.cssText = "left:" + r[0] + "px;top:" + r[1] + "px;width:" + r[2] + "px;height:" + r[3] + "px;";
      nodes.forEach(function(n){ d.appendChild(n); }); world.appendChild(d); stop.el = d; return d;
    }
    function head(id){ return clean(q("#" + id + " .s-head")); }

    function draw(){
      var defs = mk("defs", {}, svg);
      var f = mk("filter", { id:"wc2", x:"-20%", y:"-20%", width:"140%", height:"140%" }, defs);
      mk("feTurbulence", { type:"fractalNoise", baseFrequency:".006", numOctaves:"3", seed:"3", result:"n" }, f);
      mk("feDisplacementMap", { "in":"SourceGraphic", in2:"n", scale:"120", result:"d" }, f);
      mk("feGaussianBlur", { "in":"d", stdDeviation:"18" }, f);
      function zone(id, a, b, seed){ var g = mk("g", { "class":"drawn bp-zone" }, svg); zones[id] = g; return new Sketch(g, seed, a, b); }
      function wash(cls, cx, cy, rx, ry, z){ mk("ellipse", { "class":cls, cx:cx, cy:cy, rx:rx, ry:ry }, z); }

      /* lavis (sous les traits) */
      var wz = mk("g", { "class":"wash", filter:"url(#wc2)" }, svg); zones.wash = wz;
      wash("w-grey", 150, 1200, 260, 600, wz); wash("w-grey", 4200, 1150, 260, 620, wz); wash("w-ochre", 1100, 650, 700, 260, wz);
      wash("w-ochre", 2600, 1380, 800, 240, wz); wash("w-rust", 2180, 2040, 600, 220, wz); wash("w-rust", 1285, 660, 170, 300, wz);
      wash("w-ochre", 740, 1380, 330, 230, wz); wash("w-grey", 3560, 1150, 260, 420, wz);

      /* enveloppe : toujours dessinée en premier */
      var e = zone("env", 0, 1.8, 201);
      e.line(-100, GR + 30, W + 100, GR + 30, "b", { ext:0, double:true });
      e.line(X0, ROOF, X1, ROOF, "b"); e.line(X0 - 40, ROOF + 30, X1 + 40, ROOF + 30, "t");
      e.hatch([[X0, ROOF], [X1, ROOF], [X1, ROOF + 30], [X0, ROOF + 30]], 20, 14, "h", { d:1 });
      e.line(X0, UP, X1, UP, "b"); e.line(X0, UP + 30, X1, UP + 30, "t");
      e.hatch([[X0, UP], [X1, UP], [X1, UP + 30], [X0, UP + 30]], 20, 14, "h", { d:1.1 });
      e.line(X0, GR, X1, GR, "b");
      e.line(X0, ROOF, X0, GR + 30, "b"); e.line(X0 + 16, ROOF + 30, X0 + 16, GR, "f");
      e.line(X1, ROOF, X1, GR + 30, "b"); e.line(X1 - 16, ROOF + 30, X1 - 16, GR, "f");
      e.line(BX0, GR + 30, BX0, BS + 40, "b"); e.line(BX1, GR + 30, BX1, BS + 40, "b");
      e.line(BX0 - 40, BS + 40, BX1 + 40, BS + 40, "b"); e.line(BX0, BS, BX1, BS, "t");
      e.hatch([[BX0 - 300, GR + 30], [BX0, GR + 30], [BX0, BS + 40], [BX0 - 300, BS + 40]], 60, 22, "h", { d:1.2 });
      e.hatch([[BX1, GR + 30], [BX1 + 300, GR + 30], [BX1 + 300, BS + 40], [BX1, BS + 40]], 60, 22, "h", { d:1.2 });
      [BX0 + 120, BX0 + 620, BX1 - 120].forEach(function(x){ e.line(x - 20, BS + 40, x - 20, BS + 220, "t"); e.line(x + 20, BS + 40, x + 20, BS + 220, "t"); });
      for (var gx = 0; gx < W; gx += 40 + e.r() * 60){ if (gx > BX0 - 300 && gx < BX1 + 300) continue; e.line(gx, GR + 40, gx - 8, GR + 60 + e.r() * 20, "h", { ext:0, double:false }); }

      /* arbres autour */
      var tr = zone("trees", .6, 3, 207);
      [[90, 820], [210, 960], [4080, 900], [4220, 1040], [4340, 760]].forEach(function(t){ tr.pine2(t[0], GR + 30, t[1], "t"); });
      [[40, 600], [4300, 560]].forEach(function(t){ tr.tree(t[0], GR + 30, t[1]); });

      /* 01 : la colonnade */
      var z1 = zone("z1", 0, 1.6, 211);
      for (var k = 0; k <= 4; k++){ var cx = 360 + 370 * k; z1.line(cx - 6, ROOF + 30, cx - 6, UP, "t"); z1.line(cx + 6, ROOF + 30, cx + 6, UP, "f"); }
      z1.rect(1100, ROOF + 30, 370, UP - ROOF - 30, "r", { ext:6, double:false });
      z1.hatch([[1100, ROOF + 30], [1470, ROOF + 30], [1470, UP], [1100, UP]], 45, 26, "h", { d:1.2 });
      [520, 890, 1630].forEach(function(x){ z1.line(x - 40, UP - 120, x + 40, UP - 120, "f"); z1.line(x - 40, UP - 120, x - 40, UP, "f", { ext:0 }); z1.line(x + 40, UP - 120, x + 40, UP, "f", { ext:0 }); });

      /* 02 : le seuil */
      var z2 = zone("z2", 0, 1.6, 223);
      z2.line(1870, ROOF + 30, 1870, UP, "t"); z2.line(1882, ROOF + 30, 1882, UP, "f");
      for (var y = 380; y < UP; y += 90) z2.line(1870, y, 1882, y, "f", { ext:0, double:false });
      z2.rect(3020, 420, 120, 580, "t"); z2.line(3080, 420, 3080, UP, "f"); z2.line(2960, UP, 3200, UP, "f");
      z2.line(3040, 700, 3060, 700, "t", { ext:0 }); z2.line(3100, 700, 3120, 700, "t", { ext:0 });

      /* 03 : l'escalier */
      var z3 = zone("z3", 0, 1.8, 229);
      z3.line(3180, UP + 30, 3180, GR, "t"); z3.line(3180, ROOF + 30, 3180, UP, "f");
      var fl = [[3920, UP + 30, 3640, 1250], [3640, 1250, 3920, 1475], [3920, 1475, 3640, GR]];
      fl.forEach(function(f){
        z3.line(f[0], f[1], f[2], f[3], "t");
        var n = 9; for (var i = 0; i < n; i++){ var x = f[0] + (f[2] - f[0]) * i / n, y = f[1] + (f[3] - f[1]) * i / n, x2 = f[0] + (f[2] - f[0]) * (i + 1) / n, y2 = f[1] + (f[3] - f[1]) * (i + 1) / n; z3.line(x, y, x2, y, "f", { ext:0, double:false }); z3.line(x2, y, x2, y2, "f", { ext:0, double:false }); }
        z3.line(f[0], f[1] - 70, f[2], f[3] - 70, "f", { ext:8 });
      });
      z3.line(3620, 1250, 3940, 1250, "t"); z3.line(3620, 1475, 3940, 1475, "t");

      /* 04 : les rayonnages */
      var z4 = zone("z4", 0, 1.8, 233);
      [1180, 2160].forEach(function(x0){
        [1380, 1680].forEach(function(y){ z4.line(x0 + 10, y, x0 + 970, y, "t"); z4.line(x0 + 10, y + 8, x0 + 970, y + 8, "f", { ext:0 }); });
        [x0 + 10, x0 + 490, x0 + 970].forEach(function(x){ z4.line(x, 1150, x, GR, "f"); });
      });
      z4.line(2160, UP + 30, 2160, GR, "t");

      /* 05 : les fondations */
      var z5 = zone("z5", 0, 1.6, 239);
      var cw = 1160 / 3;
      for (var c = 1; c < 3; c++) z5.line(1600 + cw * c, 1870, 1600 + cw * c, 2250, "f");
      z5.line(1600, 1870, 2760, 1870, "t"); z5.line(1600, 2060, 2760, 2060, "f");
      z5.hatch([[BX0, BS], [BX1, BS], [BX1, BS + 40], [BX0, BS + 40]], 45, 10, "h", { d:1 });

      /* 06 : la sortie */
      var z6 = zone("z6", 0, 1.6, 241);
      z6.rect(X0 - 20, 1240, 40, 460, "t"); z6.line(X0 - 60, 1240, X0 + 60, 1240, "t");
      z6.line(X0 - 300, GR + 30, X0 - 20, GR + 30, "t");
      z6.line(1160, UP + 30, 1160, GR, "t");
      z6.rect(360, 1120, 120, 50, "f"); 

      /* éléments légers : bulles d'axes, niveaux, cote */
      var lt = mk("g", { "class":"light-g bp-light" }, svg);
      ["A","B","C","D","E"].forEach(function(l, i){ var x = 360 + 370 * i; mk("line", { x1:x, y1:150, x2:x, y2:ROOF, "class":"lvl-l" }, lt); mk("circle", { cx:x, cy:130, r:22, "class":"bubble" }, lt); var t = mk("text", { x:x, y:139, "text-anchor":"middle", "class":"bubble-t bp-big" }, lt); t.textContent = l; });
      [[GR, "\u00B10,00"], [UP, "+3,40"], [ROOF, "+7,40"], [BS, "\u22122,90"]].forEach(function(l){
        var y = l[0], x0 = 4040; mk("line", { x1:X1 + 20, y1:y, x2:x0 + 110, y2:y, "class":"lvl-l" }, lt);
        mk("path", { d:"M" + (x0 - 12) + " " + (y - 20) + " L" + (x0 + 12) + " " + (y - 20) + " L" + x0 + " " + y + " Z", "class":"lvl" }, lt);
        var t = mk("text", { x:x0 + 22, y:y - 8, "class":"lvl-t bp-big" }, lt); t.textContent = l[1];
      });
      mk("line", { x1:X0, y1:2480, x2:X1, y2:2480, "class":"sb-tick" }, lt);
      [X0, X1].forEach(function(x){ mk("line", { x1:x - 10, y1:2490, x2:x + 10, y2:2470, "class":"sb-tick" }, lt); });
      var dt = mk("text", { x:(X0 + X1) / 2, y:2464, "text-anchor":"middle", "class":"lvl-t bp-big" }, lt); dt.textContent = "Une journée";
      var ab = mk("text", { x:X0, y:2540, "class":"lvl-t bp-big" }, lt); ab.textContent = "Coupe AA, échelle : à hauteur d’humain";
    }

    function buildCards(){
      var S = {}; STOPS.forEach(function(s){ S[s.key] = s; });
      card(S.s1, "c-s1", [head("s1"), clean(q("#s1 .bays"))]);
      var s2l = document.createElement("div"), s2r = document.createElement("div"); s2l.className = "c-col"; s2r.className = "c-col";
      [head("s2"), clean(q("#s2 .intro")), clean(q("#s2 .rule")), clean(q("#s2 .rule-sub"))].forEach(function(n){ s2l.appendChild(n); });
      s2r.appendChild(clean(q("#s2 .cols")));
      card(S.s2, "c-s2", [s2l, s2r]);
      var g = qa("#s3 .gest > li");
      var ol1 = document.createElement("ol"); ol1.className = "gest"; ol1.appendChild(clean(g[0]));
      card(S.g1, "c-g", [head("s3"), ol1]);
      [["g2", 1], ["g3", 2]].forEach(function(p){ var o = document.createElement("ol"); o.className = "gest"; o.appendChild(clean(g[p[1]])); card(S[p[0]], "c-g", [o]); });
      var t = qa("#s4 .notes > li");
      var u1 = document.createElement("ul"); u1.className = "notes"; t.slice(0, 4).forEach(function(n){ u1.appendChild(clean(n)); });
      var u2 = document.createElement("ul"); u2.className = "notes"; t.slice(4).forEach(function(n){ u2.appendChild(clean(n)); });
      card(S.t1, "c-t", [head("s4"), u1]); card(S.t2, "c-t c-t2", [u2]);
      card(S.s5, "c-s5", [head("s5"), clean(q("#s5 .risks"))]);
      card(S.s6, "c-s6", [head("s6"), clean(q("#s6 .fix")), clean(q("#s6 .closing"))]);
    }

    function build(){
      if (built) return; built = true;
      var bp = document.createElement("div"); bp.className = "bp";
      bp.innerHTML = '<div class="bp-stage"><div class="bp-world"></div>' +
        '<div class="bp-hero"></div>' +
        '<div class="bp-hud" aria-hidden="true"><svg class="bp-mini" viewBox="0 0 4400 2600"></svg><p class="bp-cap"></p></div>' +
        '<p class="bp-hint" aria-hidden="true">Fais défiler pour entrer dans le plan</p></div>';
      var first = q(".s"); first.parentNode.insertBefore(bp, first);
      stage = bp.querySelector(".bp-stage"); world = bp.querySelector(".bp-world"); hero = bp.querySelector(".bp-hero"); cap = bp.querySelector(".bp-cap");
      svg = mk("svg", { "class":"bp-svg", viewBox:"0 0 " + W + " " + H, width:W, height:H, "aria-hidden":"true" }, world);
      draw(); buildCards();
      [".hero-text .sheet", ".hero-text h1", ".hero-text .lead"].forEach(function(s){ hero.appendChild(clean(q(s))); });
      mini = bp.querySelector(".bp-mini");
      mk("rect", { x:X0, y:ROOF, width:X1 - X0, height:GR - ROOF, "class":"m-b" }, mini);
      mk("line", { x1:X0, y1:UP, x2:X1, y2:UP, "class":"m-b" }, mini);
      mk("rect", { x:BX0, y:GR, width:BX1 - BX0, height:BS + 40 - GR, "class":"m-b" }, mini);
      mk("line", { x1:0, y1:GR + 30, x2:W, y2:GR + 30, "class":"m-b" }, mini);
      miniCam = mk("rect", { "class":"m-cam" }, mini);
      bp.style.height = ((N - 1) * 105 + 100) + "vh";
      zones.env.classList.add("go"); zones.trees.classList.add("go"); zones.wash.parentNode && svg.classList.add("go");
    }

    function camFor(stop, vw, vh, top){
      var r = stop.cam, availW = stop.side ? vw * .6 : vw * .88, availH = (vh - top) * .86;
      var s = Math.min(availW / r[2], availH / r[3], .9);
      var cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
      var sx = stop.side ? vw * .67 : vw / 2, sy = top + (vh - top) / 2 + (stop.side ? 10 : 0);
      return { s:s, x:cx, y:cy, sx:sx, sy:sy };
    }
    var ease = function(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var lastKey = "", lastQs = "", raf = 0;
    function frame(){
      raf = 0; if (!active) return;
      var rect = stage.parentNode.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, top = 66;
      var total = rect.height - vh, prog = Math.min(1, Math.max(0, -rect.top / (total || 1)));
      var p = Math.min(N - 1, prog * ((N - 1) + .45));
      var i = Math.min(N - 2, Math.floor(p)), t = p - i, HOLD = .38, u = t < HOLD ? 0 : ease((t - HOLD) / (1 - HOLD));
      var a = camFor(STOPS[i], vw, vh, top), b = camFor(STOPS[i + 1], vw, vh, top);
      var dist = Math.hypot(a.x - b.x, a.y - b.y), dip = Math.min(.42, dist / 5200) * Math.sin(Math.PI * u);
      var s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * u) * (1 - dip);
      var cx = a.x + (b.x - a.x) * u, cy = a.y + (b.y - a.y) * u, sx = a.sx + (b.sx - a.sx) * u, sy = a.sy + (b.sy - a.sy) * u;
      world.style.transform = "translate(" + (sx - cx * s).toFixed(2) + "px," + (sy - cy * s).toFixed(2) + "px) scale(" + s.toFixed(4) + ")";
      var qs = Math.pow(1.15, Math.round(Math.log(s) / Math.log(1.15))).toFixed(3); if (qs !== lastQs){ root.style.setProperty("--bp-s", qs); lastQs = qs; }
      var near = Math.round(p);
      STOPS.forEach(function(st, k){
        if (st.el) st.el.classList.toggle("on", Math.abs(p - k) < .55);
        if (st.zone && p > k - .9) zones[st.zone].classList.add("go");
      });
      hero.style.opacity = Math.max(0, 1 - p * 2.6) * 1 + Math.max(0, (p - (N - 1.6)) * 2.6);
      hero.style.pointerEvents = hero.style.opacity > .5 ? "auto" : "none";
      stage.querySelector(".bp-hint").style.opacity = Math.max(0, 1 - p * 4);
      var key = STOPS[near].label; if (key !== lastKey){ cap.textContent = key; lastKey = key; }
      var vx = (0 - (sx - cx * s)) / s, vy = (top - (sy - cy * s)) / s;
      miniCam.setAttribute("x", vx.toFixed(0)); miniCam.setAttribute("y", vy.toFixed(0)); miniCam.setAttribute("width", (vw / s).toFixed(0)); miniCam.setAttribute("height", ((vh - top) / s).toFixed(0));
    }
    function req(){ if (!raf) raf = requestAnimationFrame(frame); }
    var can = window.matchMedia("(min-width: 900px) and (prefers-reduced-motion: no-preference)");
    function set(on){
      on = on && can.matches; active = on;
      root.classList.toggle("bp-on", on);
      if (on){ build(); req(); }
    }
    window.addEventListener("scroll", req, { passive:true });
    window.addEventListener("resize", req);
    if (can.addEventListener) can.addEventListener("change", function(){ set(root.getAttribute("data-layout") === "blueprint"); });
    return { set:set };
  })();

  /* ---------- mise en page : blueprint ---------- */
  root.setAttribute("data-layout", "blueprint"); BP.set(true);

  /* ---------- clair / sombre ---------- */
  var btn = document.getElementById("modeBtn"), mq = window.matchMedia("(prefers-color-scheme: dark)");
  try { var sv = localStorage.getItem("reflexe-theme"); if (sv === "light" || sv === "dark") root.setAttribute("data-theme", sv); } catch(e){}
  function dark(){ var t = root.getAttribute("data-theme"); return t ? t === "dark" : mq.matches; }
  function sync(){ var d = dark(); btn.textContent = d ? "Clair" : "Sombre"; btn.setAttribute("aria-label", d ? "Passer en mode clair" : "Passer en mode sombre"); }
  btn.addEventListener("click", function(){ root.setAttribute("data-theme", dark() ? "light" : "dark"); try { localStorage.setItem("reflexe-theme", root.getAttribute("data-theme")); } catch(e){} sync(); });
  if (mq.addEventListener) mq.addEventListener("change", sync);
  sync();
})();

