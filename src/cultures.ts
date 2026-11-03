'use strict';
// Country-specific fictional characters; no real officeholders are represented.
const NAME_POOLS:Record<string,[string[],string[]]>={
 tr:[['Ada','Defne','Elif','Leyla','Deniz','Emre','Ozan','Cem','Selin'],['Yılmaz','Demir','Kaya','Çelik','Şahin','Aydın','Arslan','Yıldız','Koç','Öztürk']],
 en:[['Oliver','Amelia','Harry','Isla','George','Charlotte','Jack','Emily'],['Smith','Jones','Taylor','Brown','Wilson','Davies','Evans','Thomas']],
 ga:[['Aoife','Saoirse','Niamh','Ciara','Cian','Seán','Oisín','Fionn'],["O’Brien","O’Connor",'Murphy','Kelly','Walsh','Byrne','Ryan','Doyle']],
 de:[['Lukas','Anna','Felix','Lena','Jonas','Clara','Leon','Hannah'],['Müller','Schmidt','Weber','Fischer','Wagner','Becker','Hoffmann','Schäfer']],
 fr:[['Camille','Louis','Chloé','Gabriel','Manon','Antoine','Élodie','Julien'],['Martin','Bernard','Dubois','Laurent','Moreau','Lefebvre','Petit','Roux']],
 es:[['Lucía','Hugo','Sofía','Mateo','Carmen','Javier','Alba','Diego'],['García','Fernández','López','Martínez','Sánchez','Romero','Navarro','Ruiz']],
 ca:[['Laia','Jordi','Núria','Marc','Aina','Pau','Mireia','Arnau'],['Vidal','Serra','Puig','Ferrer','Soler','Pujol','Roca','Vila']],
 pt:[['Inês','João','Mariana','Tiago','Beatriz','Afonso','Leonor','Diogo'],['Silva','Santos','Ferreira','Pereira','Costa','Oliveira','Rodrigues','Martins']],
 it:[['Giulia','Lorenzo','Sofia','Matteo','Chiara','Alessandro','Francesca','Marco'],['Rossi','Russo','Ferrari','Esposito','Bianchi','Romano','Ricci','Marino']],
 nl:[['Daan','Sophie','Bram','Emma','Lotte','Luuk','Noor','Thijs'],['de Vries','van Dijk','Bakker','Visser','Smit','Meijer','de Boer','Mulder']],
 sv:[['Elsa','Oscar','Astrid','Elias','Linnea','Hugo','Freja','Axel'],['Andersson','Johansson','Karlsson','Nilsson','Eriksson','Larsson','Lindberg','Sjöberg']],
 no:[['Ingrid','Magnus','Sigrid','Henrik','Nora','Olav','Sofie','Eirik'],['Hansen','Johansen','Olsen','Larsen','Berg','Nilsen','Solberg','Haugen']],
 da:[['Frederik','Ida','Mikkel','Alma','Søren','Clara','Emil','Maja'],['Nielsen','Jensen','Hansen','Pedersen','Andersen','Christensen','Madsen','Poulsen']],
 fo:[['Bára','Jógvan','Sólja','Rói','Annika','Bárður','Rannvá','Heðin'],['Joensen','Hansen','Petersen','Jacobsen','Olsen','Jensen','Poulsen','Mortensen']],
 fi:[['Aino','Eero','Sofia','Onni','Helmi','Mikko','Veera','Lauri'],['Korhonen','Virtanen','Mäkinen','Nieminen','Hämäläinen','Laine','Heikkinen','Salonen']],
 is:[['Jón','Anna','Guðrún','Einar','Sigríður','Ólafur','Katrín','Arnar'],['Jónsson','Jónsdóttir','Sigurðsson','Sigurðardóttir','Guðmundsson','Guðmundsdóttir','Einarsson','Einarsdóttir']],
 pl:[['Zofia','Jan','Zuzanna','Jakub','Alicja','Antoni','Maja','Piotr'],['Nowak','Kowalski','Wiśniewski','Wójcik','Kowalczyk','Kamiński','Lewandowski','Zieliński']],
 cs:[['Eliška','Jakub','Tereza','Jan','Anna','Tomáš','Adéla','Matěj'],['Novák','Svoboda','Novotný','Dvořák','Černý','Procházka','Kučera','Veselý']],
 sk:[['Zuzana','Martin','Lucia','Michal','Katarína','Peter','Veronika','Tomáš'],['Horváth','Kováč','Varga','Tóth','Nagy','Baláž','Molnár','Lukáč']],
 hu:[['Anna','Bence','Eszter','Máté','Réka','Dániel','Zsófia','Ádám'],['Nagy','Kovács','Tóth','Szabó','Horváth','Varga','Kiss','Molnár']],
 ro:[['Ioana','Andrei','Elena','Alexandru','Maria','Mihai','Raluca','Vlad'],['Popescu','Ionescu','Popa','Dumitrescu','Stan','Stoica','Rusu','Marin']],
 ru:[['Anastasia','Dmitri','Ekaterina','Alexei','Natalia','Mikhail','Irina','Sergei'],['Ivanov','Smirnov','Kuznetsov','Popov','Sokolov','Morozov','Petrov','Volkov']],
 uk:[['Oksana','Dmytro','Kateryna','Oleksandr','Iryna','Andrii','Olena','Taras'],['Shevchenko','Kovalenko','Bondarenko','Tkachenko','Kravchenko','Melnyk','Boyko','Koval']],
 be:[['Alena','Maksim','Nastassia','Pavel','Volha','Andrei','Tatsiana','Siarhei'],['Kavalchuk','Ivanou','Kazlou','Novik','Piatrou','Kravets','Savitski','Marchanka']],
 lt:[['Austėja','Jonas','Gabija','Lukas','Ieva','Mantas','Rūta','Tomas'],['Kazlauskas','Jankauskas','Petrauskas','Stankevičius','Vasiliauskas','Žukauskas','Butkus','Paulauskas']],
 lv:[['Laima','Jānis','Ilze','Mārtiņš','Līga','Andris','Dace','Kristaps'],['Bērziņš','Kalniņš','Ozoliņš','Jansons','Liepiņš','Eglītis','Balodis','Vītols']],
 et:[['Liis','Martin','Maarja','Rasmus','Kertu','Andres','Kadri','Joonas'],['Tamm','Saar','Sepp','Mägi','Kask','Kukk','Rebane','Ilves']],
 el:[['Eleni','Nikos','Sofia','Giorgos','Dimitra','Kostas','Katerina','Andreas'],['Papadopoulos','Georgiou','Nikolaou','Dimitriou','Pappas','Ioannou','Christou','Antoniou']],
 sq:[['Arta','Arben','Elira','Ilir','Besa','Dritan','Liridona','Besnik'],['Hoxha','Shehu','Dervishi','Krasniqi','Gashi','Berisha','Shala','Kelmendi']],
 sr:[['Milica','Nikola','Jelena','Stefan','Ana','Luka','Ivana','Miloš'],['Jovanović','Petrović','Nikolić','Marković','Đorđević','Stojanović','Ilić','Pavlović']],
 hr:[['Petra','Luka','Ivana','Ivan','Ana','Marko','Mia','Filip'],['Horvat','Kovačević','Babić','Marić','Novak','Jurić','Kovačić','Vuković']],
 bs:[['Amina','Adnan','Lejla','Emir','Selma','Haris','Emina','Amir'],['Hodžić','Hadžić','Delić','Begović','Halilović','Kovačević','Mehić','Alić']],
 sl:[['Nika','Luka','Eva','Jan','Maja','Žan','Lara','Miha'],['Novak','Horvat','Kovačič','Krajnc','Zupančič','Potočnik','Korošec','Vidmar']],
 mk:[['Ana','Aleksandar','Elena','Stefan','Marija','Nikola','Ivana','Bojan'],['Stojanovski','Trajkovski','Petrovski','Nikolovski','Jovanovski','Ristovski','Kostovski','Ilievski']],
 bg:[['Viktoria','Georgi','Maria','Ivan','Elena','Dimitar','Desislava','Nikolai'],['Ivanov','Georgiev','Dimitrov','Petrov','Nikolov','Stoyanov','Todorov','Hristov']],
 ka:[['Nino','Giorgi','Tamar','Davit','Salome','Levan','Mariam','Irakli'],['Beridze','Kapanadze','Gelashvili','Maisuradze','Lomidze','Tsiklauri','Dolidze','Japaridze']],
 hy:[['Anahit','Aram','Mariam','Tigran','Narine','Hayk','Lilit','Vahan'],['Sargsyan','Grigoryan','Harutyunyan','Hakobyan','Petrosyan','Vardanyan','Gevorgyan','Manukyan']],
 az:[['Aysel','Elvin','Leyla','Rəşad','Nigar','Orxan','Günel','Murad'],['Məmmədov','Əliyev','Hüseynov','Həsənov','Quliyev','İsmayılov','Əhmədov','Rzayev']],
 mt:[['Maria','Joseph','Martina','Luke','Francesca','Matthew','Nicole','Daniel'],['Borg','Camilleri','Vella','Farrugia','Zammit','Galea','Micallef','Attard']]
};
const COUNTRY_CULTURES:Record<string,string[]>={'Türkiye':['tr'],'Kuzey Kıbrıs Türk Cumhuriyeti':['tr'],'Vatikan':['it'],'San Marino':['it'],'İtalya':['it'],'Birleşik Krallık':['en'],'Jersey':['en','fr'],'Guernsey':['en','fr'],'Man Adası':['en'],'İrlanda':['ga'],'Almanya':['de'],'Avusturya':['de'],'Lihtenştayn':['de'],'İsviçre':['de','fr','it'],'Fransa':['fr'],'Monako':['fr'],'Lüksemburg':['fr','de'],'Belçika':['nl','fr'],'Hollanda':['nl'],'İspanya':['es'],'Andorra':['ca'],'Portekiz':['pt'],'İsveç':['sv'],'Åland':['sv'],'Norveç':['no'],'Danimarka':['da'],'Faroe Adaları':['fo'],'Finlandiya':['fi'],'İzlanda':['is'],'Polonya':['pl'],'Çek Cumhuriyeti':['cs'],'Slovakya':['sk'],'Macaristan':['hu'],'Romanya':['ro'],'Moldova':['ro'],'Rusya':['ru'],'Ukrayna':['uk'],'Beyaz Rusya':['be'],'Litvanya':['lt'],'Letonya':['lv'],'Estonya':['et'],'Yunanistan':['el'],'Kıbrıs Cumhuriyeti':['el'],'Arnavutluk':['sq'],'Kosova':['sq'],'Sırbistan':['sr'],'Karadağ':['sr'],'Hırvatistan':['hr'],'Bosna-Hersek':['bs','hr','sr'],'Slovenya':['sl'],'Kuzey Makedonya':['mk'],'Bulgaristan':['bg'],'Gürcistan':['ka'],'Ermenistan':['hy'],'Azerbaycan':['az'],'Malta':['mt']};
function cultureForRegion(r: number){const home=REGION_LAYOUT[r]?.home??0;return COUNTRY_CULTURES[DEF[home]?.n]||['en'];}
function regionalName(r: number,seed: number=null){const cultures=cultureForRegion(r),culture=cultures[seed==null?rint(0,cultures.length-1):seed%cultures.length],pool=NAME_POOLS[culture];let name='';for(let k=0;k<50;k++){name=pick(pool[0])+' '+pick(pool[1]);if(!G.ps.some(p=>p.alive&&p.name===name))break;}return name;}
const originalMkP=mkP;
mkP=function(opts:Partial<Person>={}){const r=opts.r??0,autoForm=ui.view==='make'&&!(ui.cnew.name||'').trim()&&typeof opts.name==='string'&&FN.some(n=>opts.name.startsWith(n+' '))&&LN.some(n=>opts.name.endsWith(' '+n)),explicit=typeof opts.name==='string'&&!autoForm;const p=originalMkP({...opts,name:explicit?opts.name:regionalName(r)});p.nameCulture=cultureForRegion(r)[0];p.customName=explicit;return p;};
let migrateNames = function(){if(!G)return;G.ps.forEach(p=>{if(p.nameCulture)return;const generated=FN.some(n=>p.name.startsWith(n+' '))&&LN.some(n=>p.name.endsWith(' '+n));const custom=p.customName===true||(p.id===G.pid&&p.hist.some(h=>h.t.includes('Yeni bir hayata')));if(generated&&!custom)p.name=regionalName(p.r,p.id);p.nameCulture=cultureForRegion(p.r)[0];p.customName=custom;});}
const originalStartCitizen=startCitizen;
startCitizen=function(opts: Partial<Person>={}){const auto=typeof opts.name==='string'&&FN.some(n=>opts.name.startsWith(n+' '))&&LN.some(n=>opts.name.endsWith(' '+n));if(auto){opts={...opts};delete opts.name;}originalStartCitizen(opts);};

/* Oyuncunun görünmesini istemediği adlar, elle girişlerde ve eski kayıtlarda da filtrelenir. */
const excludedNamePattern=/(^|[^\p{L}])(?:[mM][eE][rR][tT]|[mM][eE][lL][iIİı][sS])(?=$|[^\p{L}])/u;
const excludedNameReplacement=/(^|[^\p{L}])([mM][eE][rR][tT]|[mM][eE][lL][iIİı][sS])(?=$|[^\p{L}])/gu;
const safeTextCache=new Map<string,string>();
function safeDisplayText(text: string){if(safeTextCache.has(text))return safeTextCache.get(text);const clean=text.replace(excludedNameReplacement,(_,prefix,word)=>prefix+(word.length===4?'Deniz':'Ece'));if(safeTextCache.size>=4096)safeTextCache.delete(safeTextCache.keys().next().value);safeTextCache.set(text,clean);return clean;}
function safeRegionalName(r: number,state: GameState){const pool=NAME_POOLS[cultureForRegion(r)[0]];let name='';for(let i=0;i<50;i++){name=pick(pool[0])+' '+pick(pool[1]);if(!excludedNamePattern.test(name)&&!state.ps.some(p=>p.name===name))break;}return name;}
function sanitizeGameNames(state:GameState):GameState{const renamed:[string,string][]=[];state.ps.forEach(p=>{if(excludedNamePattern.test(p.name)){const old=p.name;p.name=safeRegionalName(p.r,state);renamed.push([old,p.name]);}});
 function scrub(value: unknown){if(typeof value==='string'){let text=value;for(const [old,name] of renamed)text=text.split(old).join(name);return safeDisplayText(text);}if(Array.isArray(value)){for(let i=0;i<value.length;i++)value[i]=scrub(value[i]);}else if(value&&typeof value==='object'){for(const key of Object.keys(value))(value as Record<string,unknown>)[key]=scrub((value as Record<string,unknown>)[key]);}return value;}
 return scrub(state) as GameState;
}
const safeBaseMkP=mkP;
mkP=function(opts:Partial<Person>={}){if(typeof opts.name==='string'&&excludedNamePattern.test(opts.name))opts={...opts,name:safeRegionalName(opts.r??0,G)};return safeBaseMkP(opts);};
const safeBaseMigration=migrateState;
migrateState=function(state){return sanitizeGameNames(safeBaseMigration(state));};
const safeBaseNames=migrateNames;
migrateNames=function(){if(G)sanitizeGameNames(G);safeBaseNames();};
const safeBaseSave=save;
save=function(){if(G)sanitizeGameNames(G);safeBaseSave();};
// Empty forms still get local random names; entered text is cleaned before it can be echoed.
document.addEventListener('input',e=>{if(eventElement(e).id==='f-name'&&excludedNamePattern.test(eventElement<HTMLInputElement | HTMLSelectElement>(e).value)){eventElement<HTMLInputElement | HTMLSelectElement>(e).value=safeDisplayText(eventElement<HTMLInputElement | HTMLSelectElement>(e).value);ui.cnew.name=eventElement<HTMLInputElement | HTMLSelectElement>(e).value;}},true);
