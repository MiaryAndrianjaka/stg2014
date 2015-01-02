
var _=require("underscore");
var ping=require("net-ping");
var EventEmitter=require('events').EventEmitter;
var ev=new EventEmitter();
var async=require("async");

module.exports={
run:function(){
//-------------------------−>demander la liste des hote
setInterval(appel,60000);

}
};
//-------------------->interroger
function appel()
{

var s=ping.createSession();

Host.find({}).exec(function(err,found){
_.each(found,function(h){
console.log("**********************************************************************");
interroger(h.ip,s);
});

});

}



function interroger(host,session)
{
var t=[];
rappelPing(host,session,50,t);

}

function montrer(s)
{
console.log(s);
}



//------------------------>pinger n fw un host

function rappelPing(host,session,n,tab)
{

if(n==0)
{
//----------------------------condition d'arret->transmission dans la db
console.log("host:"+host);
var chiffres=statistique(tab);
console.log(chiffres);

Host.find({ip:host}).exec(function(err,found){
_.each(found,function(h){
h.last_check=new Date();
h.moyenne=chiffres.moyenne;
h.statu=(chiffres.perte>45)?"down":"up";
h.perte_paquet=chiffres.perte;
h.min=chiffres.min;
h.max=chiffres.max;
h.save(function(err,s){
Host.publishUpdate(s.id,s);
});
});

Log_ping.create({ip:host,moyenne:chiffres.moyenne,
perte_paquet:chiffres.perte,
min:chiffres.min,
max:chiffres.max
}).exec(function(){
console.log("new created");
});


});

//-------------−>reinitialisation des valeurs

tab=[];
//ev.emit("vita",host);
}
else
{
///------------------iteration de la boucle

//------------------>si host---->regexp diso retour


session.pingHost(host,function(error,target,sent,rcvd){
var reprise=false;

if(error){
//console.log(error.toString()+"pour hote:"+target);
//console.log(target);

if(error.toString()=="Error: Socket closed")reprise=true;
}

var r=(error instanceof ping.RequestTimedOutError)?false:true;
tab.push({
temps:(!r)?0:(rcvd-sent),
reached:r
});

//console.log((rcvd-sent)+"   reach "+r);
if(reprise){interroger(target);
console.log("reprise pour:"+target);
}
else
rappelPing(host,session,n-1,tab);

});


}

}


function statistique(tab)
{
//console.log("Longueur du tableau:"+tab.length);
var t=[];
var r=0;
var i,s=0;
for(i=0;i<tab.length;i++)
	{s+=tab[i].temps;
t[i]=tab[i].temps;
if(tab[i].reached)r++;
}


return{
moyenne:s/tab.length,
min:_.min(t)  ,
max:_.max(t),
perte:(50-r)
}

}

