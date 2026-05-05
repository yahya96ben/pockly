import { useState, useEffect, useRef } from "react";
import { auth, authApi, restaurantsApi, productsApi, ordersApi } from "./api.js";

/* ═══════════════════════════════════════════════════════════
   STORAGE
   ═══════════════════════════════════════════════════════════ */
/* Storage now lives in the backend (Supabase). All data flows through ./api.js */

/* ═══════════════════════════════════════════════════════════
   SEED DATA
   ═══════════════════════════════════════════════════════════ */
const SEED_PRODUCTS = [
  {id:"p1",type:"unit",name:"Pain Tradition",price:1.20,description:"Baguette tradition croustillante, façonnée à la main chaque matin.",photo:"🥖",stock:45,category:"Boulangerie"},
  {id:"p2",type:"unit",name:"Croissant Beurre",price:1.40,description:"Croissant pur beurre AOP, feuilleté et doré à point.",photo:"🥐",stock:30,category:"Viennoiserie"},
  {id:"p3",type:"unit",name:"Pain au Chocolat",price:1.50,description:"Deux barres de chocolat noir en pâte feuilletée croustillante.",photo:"🍫",stock:25,category:"Viennoiserie"},
  {id:"p4",type:"composable",name:"Poké Bowl",description:"Composez votre Poké Bowl sur mesure avec vos ingrédients préférés.",photo:"🥗",category:"Restaurant",basePrice:8.50,
    options:[
      {groupName:"Taille",type:"single",required:true,choices:[{id:"s1",name:"Regular",priceDelta:0,stock:20},{id:"s2",name:"Large",priceDelta:3,stock:15}]},
      {groupName:"Base",type:"single",required:true,choices:[{id:"b1",name:"Riz vinaigré",priceDelta:0,stock:40},{id:"b2",name:"Riz complet",priceDelta:.5,stock:30},{id:"b3",name:"Nouilles soba",priceDelta:1,stock:20}]},
      {groupName:"Protéine",type:"single",required:true,choices:[{id:"pr1",name:"Saumon",priceDelta:0,stock:25},{id:"pr2",name:"Thon",priceDelta:1,stock:18},{id:"pr3",name:"Poulet croustillant",priceDelta:0,stock:22},{id:"pr4",name:"Tofu mariné",priceDelta:0,stock:30}]},
      {groupName:"Toppings",type:"multi",maxSelect:4,required:false,choices:[{id:"t1",name:"Avocat",priceDelta:1.5,stock:35},{id:"t2",name:"Edamame",priceDelta:.8,stock:50},{id:"t3",name:"Mangue",priceDelta:1,stock:28},{id:"t4",name:"Concombre",priceDelta:.5,stock:60},{id:"t5",name:"Algues wakamé",priceDelta:.8,stock:40},{id:"t6",name:"Oignons crispy",priceDelta:.5,stock:55}]},
      {groupName:"Sauce",type:"single",required:true,choices:[{id:"sa1",name:"Soja sésame",priceDelta:0,stock:99},{id:"sa2",name:"Spicy mayo",priceDelta:0,stock:99},{id:"sa3",name:"Ponzu",priceDelta:0,stock:99}]},
    ]},
  {id:"p5",type:"composable",name:"Salade Signature",description:"Créez la salade parfaite à votre image.",photo:"🥬",category:"Restaurant",basePrice:7,
    options:[
      {groupName:"Base verte",type:"single",required:true,choices:[{id:"sv1",name:"Mesclun",priceDelta:0,stock:30},{id:"sv2",name:"Roquette",priceDelta:.5,stock:25},{id:"sv3",name:"Épinards",priceDelta:.5,stock:22}]},
      {groupName:"Protéine",type:"single",required:true,choices:[{id:"sp1",name:"Poulet grillé",priceDelta:0,stock:20},{id:"sp2",name:"Chèvre chaud",priceDelta:1,stock:18},{id:"sp3",name:"Falafel",priceDelta:.5,stock:24}]},
      {groupName:"Extras",type:"multi",maxSelect:3,required:false,choices:[{id:"se1",name:"Noix",priceDelta:.8,stock:40},{id:"se2",name:"Cranberries",priceDelta:.8,stock:45},{id:"se3",name:"Avocat",priceDelta:1.5,stock:30},{id:"se4",name:"Croûtons ail",priceDelta:.5,stock:50}]},
    ]},
];
const SEED_SHOP = {name:"Maison Delices",phone:"+32 470 12 34 56",address:"Rue de la Boulangerie 12, 1000 Bruxelles",prepTime:15,loyaltyTarget:6,loyaltyReward:"1 croissant offert"};

/* ═══════════════════ PHONE COUNTRIES (Point 6) ═══════════════════ */
/* Liste complète – 231 pays/territoires, indicatifs ITU-T E.164, tri FR alphabétique */
const COUNTRIES = [
  {code:"AF",name:"Afghanistan",dial:"+93",flag:"🇦🇫",len:[9]},
  {code:"ZA",name:"Afrique du Sud",dial:"+27",flag:"🇿🇦",len:[9]},
  {code:"AL",name:"Albanie",dial:"+355",flag:"🇦🇱",len:[9]},
  {code:"DZ",name:"Algérie",dial:"+213",flag:"🇩🇿",len:[9]},
  {code:"DE",name:"Allemagne",dial:"+49",flag:"🇩🇪",len:[10,11]},
  {code:"AD",name:"Andorre",dial:"+376",flag:"🇦🇩",len:[6,8,9]},
  {code:"AO",name:"Angola",dial:"+244",flag:"🇦🇴",len:[9]},
  {code:"AI",name:"Anguilla",dial:"+1264",flag:"🇦🇮",len:[7]},
  {code:"AQ",name:"Antarctique",dial:"+672",flag:"🇦🇶",len:[6]},
  {code:"AG",name:"Antigua-et-Barbuda",dial:"+1268",flag:"🇦🇬",len:[7]},
  {code:"SA",name:"Arabie saoudite",dial:"+966",flag:"🇸🇦",len:[9]},
  {code:"AR",name:"Argentine",dial:"+54",flag:"🇦🇷",len:[10,11]},
  {code:"AM",name:"Arménie",dial:"+374",flag:"🇦🇲",len:[8]},
  {code:"AW",name:"Aruba",dial:"+297",flag:"🇦🇼",len:[7]},
  {code:"AU",name:"Australie",dial:"+61",flag:"🇦🇺",len:[9]},
  {code:"AT",name:"Autriche",dial:"+43",flag:"🇦🇹",len:[10,11]},
  {code:"AZ",name:"Azerbaïdjan",dial:"+994",flag:"🇦🇿",len:[9]},
  {code:"BS",name:"Bahamas",dial:"+1242",flag:"🇧🇸",len:[7]},
  {code:"BH",name:"Bahreïn",dial:"+973",flag:"🇧🇭",len:[8]},
  {code:"BD",name:"Bangladesh",dial:"+880",flag:"🇧🇩",len:[10]},
  {code:"BB",name:"Barbade",dial:"+1246",flag:"🇧🇧",len:[7]},
  {code:"BE",name:"Belgique",dial:"+32",flag:"🇧🇪",len:[9]},
  {code:"BZ",name:"Belize",dial:"+501",flag:"🇧🇿",len:[7]},
  {code:"BJ",name:"Bénin",dial:"+229",flag:"🇧🇯",len:[8,10]},
  {code:"BM",name:"Bermudes",dial:"+1441",flag:"🇧🇲",len:[7]},
  {code:"BT",name:"Bhoutan",dial:"+975",flag:"🇧🇹",len:[8]},
  {code:"BY",name:"Biélorussie",dial:"+375",flag:"🇧🇾",len:[9]},
  {code:"BO",name:"Bolivie",dial:"+591",flag:"🇧🇴",len:[8]},
  {code:"BA",name:"Bosnie-Herzégovine",dial:"+387",flag:"🇧🇦",len:[8]},
  {code:"BW",name:"Botswana",dial:"+267",flag:"🇧🇼",len:[7,8]},
  {code:"BR",name:"Brésil",dial:"+55",flag:"🇧🇷",len:[10,11]},
  {code:"BN",name:"Brunei",dial:"+673",flag:"🇧🇳",len:[7]},
  {code:"BG",name:"Bulgarie",dial:"+359",flag:"🇧🇬",len:[8,9]},
  {code:"BF",name:"Burkina Faso",dial:"+226",flag:"🇧🇫",len:[8]},
  {code:"BI",name:"Burundi",dial:"+257",flag:"🇧🇮",len:[8]},
  {code:"KH",name:"Cambodge",dial:"+855",flag:"🇰🇭",len:[8,9]},
  {code:"CM",name:"Cameroun",dial:"+237",flag:"🇨🇲",len:[9]},
  {code:"CA",name:"Canada",dial:"+1",flag:"🇨🇦",len:[10]},
  {code:"CV",name:"Cap-Vert",dial:"+238",flag:"🇨🇻",len:[7]},
  {code:"CL",name:"Chili",dial:"+56",flag:"🇨🇱",len:[9]},
  {code:"CN",name:"Chine",dial:"+86",flag:"🇨🇳",len:[11]},
  {code:"CY",name:"Chypre",dial:"+357",flag:"🇨🇾",len:[8]},
  {code:"CO",name:"Colombie",dial:"+57",flag:"🇨🇴",len:[10]},
  {code:"KM",name:"Comores",dial:"+269",flag:"🇰🇲",len:[7]},
  {code:"CG",name:"Congo",dial:"+242",flag:"🇨🇬",len:[9]},
  {code:"CD",name:"Congo (RDC)",dial:"+243",flag:"🇨🇩",len:[9]},
  {code:"KP",name:"Corée du Nord",dial:"+850",flag:"🇰🇵",len:[8,10]},
  {code:"KR",name:"Corée du Sud",dial:"+82",flag:"🇰🇷",len:[9,10]},
  {code:"CR",name:"Costa Rica",dial:"+506",flag:"🇨🇷",len:[8]},
  {code:"CI",name:"Côte d'Ivoire",dial:"+225",flag:"🇨🇮",len:[10]},
  {code:"HR",name:"Croatie",dial:"+385",flag:"🇭🇷",len:[8,9]},
  {code:"CU",name:"Cuba",dial:"+53",flag:"🇨🇺",len:[8]},
  {code:"DK",name:"Danemark",dial:"+45",flag:"🇩🇰",len:[8]},
  {code:"DJ",name:"Djibouti",dial:"+253",flag:"🇩🇯",len:[8]},
  {code:"DM",name:"Dominique",dial:"+1767",flag:"🇩🇲",len:[7]},
  {code:"EG",name:"Égypte",dial:"+20",flag:"🇪🇬",len:[10]},
  {code:"SV",name:"El Salvador",dial:"+503",flag:"🇸🇻",len:[8]},
  {code:"AE",name:"Émirats arabes unis",dial:"+971",flag:"🇦🇪",len:[9]},
  {code:"EC",name:"Équateur",dial:"+593",flag:"🇪🇨",len:[8,9]},
  {code:"ER",name:"Érythrée",dial:"+291",flag:"🇪🇷",len:[7]},
  {code:"ES",name:"Espagne",dial:"+34",flag:"🇪🇸",len:[9]},
  {code:"EE",name:"Estonie",dial:"+372",flag:"🇪🇪",len:[7,8]},
  {code:"US",name:"États-Unis",dial:"+1",flag:"🇺🇸",len:[10]},
  {code:"ET",name:"Éthiopie",dial:"+251",flag:"🇪🇹",len:[9]},
  {code:"FJ",name:"Fidji",dial:"+679",flag:"🇫🇯",len:[7]},
  {code:"FI",name:"Finlande",dial:"+358",flag:"🇫🇮",len:[9,10]},
  {code:"FR",name:"France",dial:"+33",flag:"🇫🇷",len:[9]},
  {code:"GA",name:"Gabon",dial:"+241",flag:"🇬🇦",len:[7,8]},
  {code:"GM",name:"Gambie",dial:"+220",flag:"🇬🇲",len:[7]},
  {code:"GE",name:"Géorgie",dial:"+995",flag:"🇬🇪",len:[9]},
  {code:"GH",name:"Ghana",dial:"+233",flag:"🇬🇭",len:[9]},
  {code:"GI",name:"Gibraltar",dial:"+350",flag:"🇬🇮",len:[8]},
  {code:"GR",name:"Grèce",dial:"+30",flag:"🇬🇷",len:[10]},
  {code:"GD",name:"Grenade",dial:"+1473",flag:"🇬🇩",len:[7]},
  {code:"GL",name:"Groenland",dial:"+299",flag:"🇬🇱",len:[6]},
  {code:"GP",name:"Guadeloupe",dial:"+590",flag:"🇬🇵",len:[9]},
  {code:"GU",name:"Guam",dial:"+1671",flag:"🇬🇺",len:[7]},
  {code:"GT",name:"Guatemala",dial:"+502",flag:"🇬🇹",len:[8]},
  {code:"GG",name:"Guernesey",dial:"+44",flag:"🇬🇬",len:[10]},
  {code:"GN",name:"Guinée",dial:"+224",flag:"🇬🇳",len:[8,9]},
  {code:"GQ",name:"Guinée équatoriale",dial:"+240",flag:"🇬🇶",len:[9]},
  {code:"GW",name:"Guinée-Bissau",dial:"+245",flag:"🇬🇼",len:[7]},
  {code:"GY",name:"Guyana",dial:"+592",flag:"🇬🇾",len:[7]},
  {code:"GF",name:"Guyane",dial:"+594",flag:"🇬🇫",len:[9]},
  {code:"HT",name:"Haïti",dial:"+509",flag:"🇭🇹",len:[8]},
  {code:"HN",name:"Honduras",dial:"+504",flag:"🇭🇳",len:[8]},
  {code:"HK",name:"Hong Kong",dial:"+852",flag:"🇭🇰",len:[8]},
  {code:"HU",name:"Hongrie",dial:"+36",flag:"🇭🇺",len:[8,9]},
  {code:"KY",name:"Îles Caïmans",dial:"+1345",flag:"🇰🇾",len:[7]},
  {code:"FO",name:"Îles Féroé",dial:"+298",flag:"🇫🇴",len:[6]},
  {code:"MP",name:"Îles Mariannes du Nord",dial:"+1670",flag:"🇲🇵",len:[7]},
  {code:"MH",name:"Îles Marshall",dial:"+692",flag:"🇲🇭",len:[7]},
  {code:"SB",name:"Îles Salomon",dial:"+677",flag:"🇸🇧",len:[5,7]},
  {code:"VG",name:"Îles Vierges britanniques",dial:"+1284",flag:"🇻🇬",len:[7]},
  {code:"VI",name:"Îles Vierges des États-Unis",dial:"+1340",flag:"🇻🇮",len:[7]},
  {code:"IN",name:"Inde",dial:"+91",flag:"🇮🇳",len:[10]},
  {code:"ID",name:"Indonésie",dial:"+62",flag:"🇮🇩",len:[9,10,11]},
  {code:"IQ",name:"Irak",dial:"+964",flag:"🇮🇶",len:[10]},
  {code:"IR",name:"Iran",dial:"+98",flag:"🇮🇷",len:[10]},
  {code:"IE",name:"Irlande",dial:"+353",flag:"🇮🇪",len:[9]},
  {code:"IS",name:"Islande",dial:"+354",flag:"🇮🇸",len:[7]},
  {code:"IL",name:"Israël",dial:"+972",flag:"🇮🇱",len:[9]},
  {code:"IT",name:"Italie",dial:"+39",flag:"🇮🇹",len:[9,10]},
  {code:"JM",name:"Jamaïque",dial:"+1876",flag:"🇯🇲",len:[7]},
  {code:"JP",name:"Japon",dial:"+81",flag:"🇯🇵",len:[10,11]},
  {code:"JE",name:"Jersey",dial:"+44",flag:"🇯🇪",len:[10]},
  {code:"JO",name:"Jordanie",dial:"+962",flag:"🇯🇴",len:[9]},
  {code:"KZ",name:"Kazakhstan",dial:"+7",flag:"🇰🇿",len:[10]},
  {code:"KE",name:"Kenya",dial:"+254",flag:"🇰🇪",len:[9,10]},
  {code:"KG",name:"Kirghizistan",dial:"+996",flag:"🇰🇬",len:[9]},
  {code:"KI",name:"Kiribati",dial:"+686",flag:"🇰🇮",len:[5,8]},
  {code:"XK",name:"Kosovo",dial:"+383",flag:"🇽🇰",len:[8]},
  {code:"KW",name:"Koweït",dial:"+965",flag:"🇰🇼",len:[8]},
  {code:"LA",name:"Laos",dial:"+856",flag:"🇱🇦",len:[8,9,10]},
  {code:"LS",name:"Lesotho",dial:"+266",flag:"🇱🇸",len:[8]},
  {code:"LV",name:"Lettonie",dial:"+371",flag:"🇱🇻",len:[8]},
  {code:"LB",name:"Liban",dial:"+961",flag:"🇱🇧",len:[7,8]},
  {code:"LR",name:"Libéria",dial:"+231",flag:"🇱🇷",len:[7,8]},
  {code:"LY",name:"Libye",dial:"+218",flag:"🇱🇾",len:[9,10]},
  {code:"LI",name:"Liechtenstein",dial:"+423",flag:"🇱🇮",len:[7]},
  {code:"LT",name:"Lituanie",dial:"+370",flag:"🇱🇹",len:[8]},
  {code:"LU",name:"Luxembourg",dial:"+352",flag:"🇱🇺",len:[8,9]},
  {code:"MO",name:"Macao",dial:"+853",flag:"🇲🇴",len:[8]},
  {code:"MK",name:"Macédoine du Nord",dial:"+389",flag:"🇲🇰",len:[8]},
  {code:"MG",name:"Madagascar",dial:"+261",flag:"🇲🇬",len:[9]},
  {code:"MY",name:"Malaisie",dial:"+60",flag:"🇲🇾",len:[9,10]},
  {code:"MW",name:"Malawi",dial:"+265",flag:"🇲🇼",len:[9]},
  {code:"MV",name:"Maldives",dial:"+960",flag:"🇲🇻",len:[7]},
  {code:"ML",name:"Mali",dial:"+223",flag:"🇲🇱",len:[8]},
  {code:"MT",name:"Malte",dial:"+356",flag:"🇲🇹",len:[8]},
  {code:"MA",name:"Maroc",dial:"+212",flag:"🇲🇦",len:[9]},
  {code:"MQ",name:"Martinique",dial:"+596",flag:"🇲🇶",len:[9]},
  {code:"MU",name:"Maurice",dial:"+230",flag:"🇲🇺",len:[7,8]},
  {code:"MR",name:"Mauritanie",dial:"+222",flag:"🇲🇷",len:[8]},
  {code:"YT",name:"Mayotte",dial:"+262",flag:"🇾🇹",len:[9]},
  {code:"MX",name:"Mexique",dial:"+52",flag:"🇲🇽",len:[10]},
  {code:"FM",name:"Micronésie",dial:"+691",flag:"🇫🇲",len:[7]},
  {code:"MD",name:"Moldavie",dial:"+373",flag:"🇲🇩",len:[8]},
  {code:"MC",name:"Monaco",dial:"+377",flag:"🇲🇨",len:[8,9]},
  {code:"MN",name:"Mongolie",dial:"+976",flag:"🇲🇳",len:[8]},
  {code:"ME",name:"Monténégro",dial:"+382",flag:"🇲🇪",len:[8,9]},
  {code:"MS",name:"Montserrat",dial:"+1664",flag:"🇲🇸",len:[7]},
  {code:"MZ",name:"Mozambique",dial:"+258",flag:"🇲🇿",len:[9]},
  {code:"MM",name:"Myanmar (Birmanie)",dial:"+95",flag:"🇲🇲",len:[8,9,10]},
  {code:"NA",name:"Namibie",dial:"+264",flag:"🇳🇦",len:[9,10]},
  {code:"NR",name:"Nauru",dial:"+674",flag:"🇳🇷",len:[7]},
  {code:"NP",name:"Népal",dial:"+977",flag:"🇳🇵",len:[10]},
  {code:"NI",name:"Nicaragua",dial:"+505",flag:"🇳🇮",len:[8]},
  {code:"NE",name:"Niger",dial:"+227",flag:"🇳🇪",len:[8]},
  {code:"NG",name:"Nigéria",dial:"+234",flag:"🇳🇬",len:[10]},
  {code:"NU",name:"Niue",dial:"+683",flag:"🇳🇺",len:[4]},
  {code:"NO",name:"Norvège",dial:"+47",flag:"🇳🇴",len:[8]},
  {code:"NC",name:"Nouvelle-Calédonie",dial:"+687",flag:"🇳🇨",len:[6]},
  {code:"NZ",name:"Nouvelle-Zélande",dial:"+64",flag:"🇳🇿",len:[8,9]},
  {code:"OM",name:"Oman",dial:"+968",flag:"🇴🇲",len:[8]},
  {code:"UG",name:"Ouganda",dial:"+256",flag:"🇺🇬",len:[9]},
  {code:"UZ",name:"Ouzbékistan",dial:"+998",flag:"🇺🇿",len:[9]},
  {code:"PK",name:"Pakistan",dial:"+92",flag:"🇵🇰",len:[10]},
  {code:"PW",name:"Palaos",dial:"+680",flag:"🇵🇼",len:[7]},
  {code:"PS",name:"Palestine",dial:"+970",flag:"🇵🇸",len:[8,9]},
  {code:"PA",name:"Panama",dial:"+507",flag:"🇵🇦",len:[7,8]},
  {code:"PG",name:"Papouasie-Nouvelle-Guinée",dial:"+675",flag:"🇵🇬",len:[8]},
  {code:"PY",name:"Paraguay",dial:"+595",flag:"🇵🇾",len:[9]},
  {code:"NL",name:"Pays-Bas",dial:"+31",flag:"🇳🇱",len:[9]},
  {code:"PE",name:"Pérou",dial:"+51",flag:"🇵🇪",len:[9]},
  {code:"PH",name:"Philippines",dial:"+63",flag:"🇵🇭",len:[10]},
  {code:"PL",name:"Pologne",dial:"+48",flag:"🇵🇱",len:[9]},
  {code:"PF",name:"Polynésie française",dial:"+689",flag:"🇵🇫",len:[8]},
  {code:"PR",name:"Porto Rico",dial:"+1787",flag:"🇵🇷",len:[7]},
  {code:"PT",name:"Portugal",dial:"+351",flag:"🇵🇹",len:[9]},
  {code:"QA",name:"Qatar",dial:"+974",flag:"🇶🇦",len:[8]},
  {code:"CF",name:"République centrafricaine",dial:"+236",flag:"🇨🇫",len:[8]},
  {code:"DO",name:"République dominicaine",dial:"+1809",flag:"🇩🇴",len:[7]},
  {code:"RE",name:"Réunion",dial:"+262",flag:"🇷🇪",len:[9]},
  {code:"RO",name:"Roumanie",dial:"+40",flag:"🇷🇴",len:[9]},
  {code:"GB",name:"Royaume-Uni",dial:"+44",flag:"🇬🇧",len:[10,11]},
  {code:"RU",name:"Russie",dial:"+7",flag:"🇷🇺",len:[10]},
  {code:"RW",name:"Rwanda",dial:"+250",flag:"🇷🇼",len:[9]},
  {code:"EH",name:"Sahara occidental",dial:"+212",flag:"🇪🇭",len:[9]},
  {code:"BL",name:"Saint-Barthélemy",dial:"+590",flag:"🇧🇱",len:[9]},
  {code:"KN",name:"Saint-Christophe-et-Niévès",dial:"+1869",flag:"🇰🇳",len:[7]},
  {code:"SM",name:"Saint-Marin",dial:"+378",flag:"🇸🇲",len:[6,10]},
  {code:"MF",name:"Saint-Martin",dial:"+590",flag:"🇲🇫",len:[9]},
  {code:"PM",name:"Saint-Pierre-et-Miquelon",dial:"+508",flag:"🇵🇲",len:[6]},
  {code:"VC",name:"Saint-Vincent-et-les-Grenadines",dial:"+1784",flag:"🇻🇨",len:[7]},
  {code:"SH",name:"Sainte-Hélène",dial:"+290",flag:"🇸🇭",len:[4]},
  {code:"LC",name:"Sainte-Lucie",dial:"+1758",flag:"🇱🇨",len:[7]},
  {code:"WS",name:"Samoa",dial:"+685",flag:"🇼🇸",len:[5,6,7]},
  {code:"AS",name:"Samoa américaines",dial:"+1684",flag:"🇦🇸",len:[7]},
  {code:"ST",name:"Sao Tomé-et-Principe",dial:"+239",flag:"🇸🇹",len:[7]},
  {code:"SN",name:"Sénégal",dial:"+221",flag:"🇸🇳",len:[9]},
  {code:"RS",name:"Serbie",dial:"+381",flag:"🇷🇸",len:[8,9]},
  {code:"SC",name:"Seychelles",dial:"+248",flag:"🇸🇨",len:[7]},
  {code:"SL",name:"Sierra Leone",dial:"+232",flag:"🇸🇱",len:[8]},
  {code:"SG",name:"Singapour",dial:"+65",flag:"🇸🇬",len:[8]},
  {code:"SK",name:"Slovaquie",dial:"+421",flag:"🇸🇰",len:[9]},
  {code:"SI",name:"Slovénie",dial:"+386",flag:"🇸🇮",len:[8,9]},
  {code:"SO",name:"Somalie",dial:"+252",flag:"🇸🇴",len:[7,8]},
  {code:"SD",name:"Soudan",dial:"+249",flag:"🇸🇩",len:[9]},
  {code:"SS",name:"Soudan du Sud",dial:"+211",flag:"🇸🇸",len:[9]},
  {code:"LK",name:"Sri Lanka",dial:"+94",flag:"🇱🇰",len:[9]},
  {code:"SE",name:"Suède",dial:"+46",flag:"🇸🇪",len:[9]},
  {code:"CH",name:"Suisse",dial:"+41",flag:"🇨🇭",len:[9]},
  {code:"SR",name:"Suriname",dial:"+597",flag:"🇸🇷",len:[6,7]},
  {code:"SY",name:"Syrie",dial:"+963",flag:"🇸🇾",len:[8,9]},
  {code:"TJ",name:"Tadjikistan",dial:"+992",flag:"🇹🇯",len:[9]},
  {code:"TW",name:"Taïwan",dial:"+886",flag:"🇹🇼",len:[9]},
  {code:"TZ",name:"Tanzanie",dial:"+255",flag:"🇹🇿",len:[9]},
  {code:"TD",name:"Tchad",dial:"+235",flag:"🇹🇩",len:[8]},
  {code:"CZ",name:"Tchéquie",dial:"+420",flag:"🇨🇿",len:[9]},
  {code:"TH",name:"Thaïlande",dial:"+66",flag:"🇹🇭",len:[8,9]},
  {code:"TL",name:"Timor oriental",dial:"+670",flag:"🇹🇱",len:[7,8]},
  {code:"TG",name:"Togo",dial:"+228",flag:"🇹🇬",len:[8]},
  {code:"TK",name:"Tokelau",dial:"+690",flag:"🇹🇰",len:[4]},
  {code:"TO",name:"Tonga",dial:"+676",flag:"🇹🇴",len:[5,7]},
  {code:"TT",name:"Trinité-et-Tobago",dial:"+1868",flag:"🇹🇹",len:[7]},
  {code:"TN",name:"Tunisie",dial:"+216",flag:"🇹🇳",len:[8]},
  {code:"TM",name:"Turkménistan",dial:"+993",flag:"🇹🇲",len:[8]},
  {code:"TC",name:"Turques-et-Caïques",dial:"+1649",flag:"🇹🇨",len:[7]},
  {code:"TR",name:"Turquie",dial:"+90",flag:"🇹🇷",len:[10]},
  {code:"TV",name:"Tuvalu",dial:"+688",flag:"🇹🇻",len:[5,6]},
  {code:"UA",name:"Ukraine",dial:"+380",flag:"🇺🇦",len:[9]},
  {code:"UY",name:"Uruguay",dial:"+598",flag:"🇺🇾",len:[8]},
  {code:"VU",name:"Vanuatu",dial:"+678",flag:"🇻🇺",len:[5,7]},
  {code:"VA",name:"Vatican",dial:"+379",flag:"🇻🇦",len:[8,9,10]},
  {code:"VE",name:"Venezuela",dial:"+58",flag:"🇻🇪",len:[10]},
  {code:"VN",name:"Viêt Nam",dial:"+84",flag:"🇻🇳",len:[9,10]},
  {code:"WF",name:"Wallis-et-Futuna",dial:"+681",flag:"🇼🇫",len:[6]},
  {code:"YE",name:"Yémen",dial:"+967",flag:"🇾🇪",len:[8,9]},
  {code:"ZM",name:"Zambie",dial:"+260",flag:"🇿🇲",len:[9]},
  {code:"ZW",name:"Zimbabwe",dial:"+263",flag:"🇿🇼",len:[9,10]},
];
/* Format any phone string to digits-only E.164 form for wa.me (no +, no spaces) */
const phoneToWaDigits = (phone) => (phone || "").replace(/[^0-9]/g, "");

/* Build a wa.me URL with pre-filled message body */
const buildWaUrl = (phone, message) => {
  const digits = phoneToWaDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message || "")}`;
};

/* Build the merchant-side reply message (for "Répondre via WhatsApp" button) */
const buildMerchantReplyMessage = (order, status) => {
  const id = "#" + (order?.shortId || order?.id?.slice(0, 6)?.toUpperCase() || order?.id || "");
  if (status === "ready") return `Bonjour ${order.customerName || ""}, votre commande ${id} est prête à être retirée. À bientôt !`;
  if (status === "preparing") return `Bonjour ${order.customerName || ""}, nous préparons votre commande ${id}. Elle sera prête dans quelques minutes.`;
  if (status === "cancelled") return `Bonjour ${order.customerName || ""}, votre commande ${id} a malheureusement dû être annulée. Nous vous contactons pour plus de détails.`;
  return `Bonjour ${order.customerName || ""}, concernant votre commande ${id} :`;
};

/* Strip leading zero(s) (national prefix, e.g. BE 0470 -> 470) */
const stripLeading0 = (digits) => digits.replace(/^0+/, '');

const validPhone = (num, countryCode) => {
  const digits = stripLeading0(num.replace(/\D/g,''));
  if (digits.length === 0) return true;
  const c = COUNTRIES.find(x => x.code === countryCode);
  if (!c) return digits.length >= 6 && digits.length <= 12;
  return c.len.includes(digits.length);
};

/* ═══════════════════ MULTI-ESTABLISHMENTS (Point 5) ═══════════════════ */
const SEED_RESTAURANTS = [
  {id:"r1",name:"Maison Delices — Centre",address:"Rue de la Boulangerie 12, 1000 Bruxelles",phone:"+32 470 12 34 56",prepTime:15,open:true},
  {id:"r2",name:"Maison Delices — Ixelles",address:"Chaussée d'Ixelles 88, 1050 Ixelles",phone:"+32 470 98 76 54",prepTime:20,open:true},
  {id:"r3",name:"Maison Delices — Uccle",address:"Rue Xavier de Bue 5, 1180 Uccle",phone:"+32 470 55 66 77",prepTime:15,open:false},
  {id:"r4",name:"Soleil Bakkery",address:"Place Colignon 32, 1030 Schaerbeek",phone:"+32 470 44 44 44",prepTime:10,open:true},
];

/* ═══════════════════════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════════════════════ */
const uid = () => Math.random().toString(36).slice(2,10);
const fmt = n => new Intl.NumberFormat("fr-BE",{style:"currency",currency:"EUR"}).format(n);
const ts = () => new Date().toLocaleString("fr-BE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
const defaultPickup = () => { const d=new Date(); d.setMinutes(d.getMinutes()+15); return d.toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"}); };

/* ═══════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════ */
const I = ({d,s=20,c="currentColor",f="none",...p}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={f} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d={d}/></svg>
);
const IC = {
  plus:"M12 5v14M5 12h14", minus:"M5 12h14", x:"M18 6L6 18M6 6l12 12",
  cart:"M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6",
  box:"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  orders:"M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6",
  check:"M20 6L9 17l-5-5", trash:"M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  edit:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
  settings:"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", back:"M19 12H5M12 19l-7-7 7-7",
  user:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  eye:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
  eyeOff:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24",
  mail:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  lock:"M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  logout:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  print:"M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  wa:"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z",
  chart:"M18 20V10M12 20V4M6 20v-6",
  qr:"M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14h1v3h3v4h-4zM14 14h2v2h-2zM14 18h2v3h-2z",
  clock:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  gift:"M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
  creditCard:"M1 4h22v16H1zM1 10h22",
  mapPin:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  msg:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  phone:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
};

/* ═══════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════ */
const C = {
  bg:"#faf8ff", surface:"#ffffff", surfaceAlt:"#f3f0fa",
  text:"#18122b", textSoft:"#5c5470", muted:"#9890a8",
  accent:"#7b2ff2", accentH:"#6518e0", accentL:"#ece5ff", accentXL:"#f7f3ff", glow:"rgba(123,47,242,.12)",
  border:"#e6e0f3", borderL:"#f0ecf9",
  success:"#0d9f6e", successL:"#d1fae5", danger:"#e02424", dangerL:"#fee2e2",
  waGreen:"#25d366", waDk:"#128c7e",
  dark:"#18122b", darkS:"#2d2347",
};
const F = { body:"'Manrope',system-ui,sans-serif", display:"'Manrope',system-ui,sans-serif", mono:"'JetBrains Mono',monospace" };

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES
   ═══════════════════════════════════════════════════════════ */
const StyleTag = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
    input:focus,textarea:focus,select:focus{border-color:${C.accent}!important;outline:none;box-shadow:0 0 0 3px ${C.glow}}
    button{border:none;cursor:pointer;font-family:${F.body}}
    ::selection{background:${C.accentL};color:${C.accent}}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:9px}
    /* === RESPONSIVE BREAKPOINTS === */
    /* Tablet landscape & below */
    @media(max-width:1024px){
      .grid-products{grid-template-columns:repeat(3,1fr)!important}
      .grid-admin{grid-template-columns:repeat(2,1fr)!important}
      .grid-editor{grid-template-columns:1fr!important}
      .grid-rests{grid-template-columns:repeat(2,1fr)!important}
      .grid-stats{grid-template-columns:repeat(2,1fr)!important}
      .main-wrap{padding:16px!important;max-width:100%!important}
    }
    /* Tablet portrait & mobile */
    @media(max-width:768px){
      .grid-products{grid-template-columns:repeat(2,1fr)!important;gap:10px!important}
      .grid-admin{grid-template-columns:repeat(2,1fr)!important;gap:10px!important}
      .grid-editor{grid-template-columns:1fr!important;gap:14px!important}
      .grid-rests{grid-template-columns:1fr!important}
      .grid-stats{grid-template-columns:repeat(2,1fr)!important}
      .checkout-row{grid-template-columns:1fr!important}
      .shop-meta{flex-direction:column;gap:4px!important;align-items:flex-start!important}
      .admin-header{padding:10px 14px!important;gap:6px!important;flex-wrap:wrap!important}
      .admin-nav{padding:4px 10px!important;gap:1px!important}
      .admin-nav button{padding:7px 10px!important;font-size:12px!important}
      .h-title{font-size:18px!important}
      .h-sub{display:none!important}
      .product-detail{max-width:100%!important;border-radius:0!important}
      .cart-footer{position:sticky;bottom:0;background:#fff;padding:12px 16px!important;box-shadow:0 -4px 12px rgba(0,0,0,.06);z-index:5}
    }
    /* Small mobile */
    @media(max-width:480px){
      .grid-products{grid-template-columns:1fr!important}
      .grid-admin{grid-template-columns:1fr!important}
      .grid-stats{grid-template-columns:1fr!important}
      .main-wrap{padding:12px!important}
      .admin-header h1{font-size:16px!important}
      .admin-header .user-pill{font-size:11px!important}
      .admin-nav{overflow-x:auto;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch}
      .admin-nav button{flex-shrink:0}
      .modal-card{padding:24px 20px!important;max-width:96vw!important}
      .auth-card{padding:24px 20px!important}
      .btn-row{flex-direction:column!important;width:100%}
      .btn-row > *{width:100%!important;justify-content:center!important}
    }
    /* Large desktop — wider main, more columns */
    @media(min-width:1280px){
      .main-wrap{max-width:1280px!important}
      .grid-products{grid-template-columns:repeat(4,1fr)!important}
      .grid-admin{grid-template-columns:repeat(4,1fr)!important}
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════
   PRINT RECEIPT
   ═══════════════════════════════════════════════════════════ */
function printReceipt(order, shopName) {
  const orderCode = order?.shortId || order?.id?.slice(0, 6)?.toUpperCase() || order?.id || "";
  const w = window.open('','','width=320,height=600');
  const items = order.items.map(i =>
    `<tr><td style="padding:3px 0">${i.qty}× ${i.name}${i.details ? `<br><small style="color:#888">${i.details}</small>` : ''}</td><td style="text-align:right;padding:3px 0;white-space:nowrap">${fmt(i.totalPrice*i.qty)}</td></tr>`
  ).join('');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ticket</title><style>*{margin:0;font-family:'Courier New',monospace;font-size:13px}body{padding:20px;max-width:300px;margin:auto}</style></head><body>
    <div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:12px;margin-bottom:12px">
      <h1 style="font-size:20px;margin-bottom:4px">${shopName}</h1>
      <div style="font-size:11px;color:#666">${order.date}</div>
      <div style="font-size:12px;margin-top:4px">#${orderCode}</div>
      ${order.customerName ? `<div style="font-size:12px">${order.customerName} · ${order.customerPhone||''}</div>` : ''}
      ${order.pickupTime ? `<div style="font-size:12px;margin-top:4px">Retrait: ${order.pickupTime}</div>` : ''}
      ${order.remarks ? `<div style="font-size:11px;color:#666;margin-top:4px">${order.remarks}</div>` : ''}
      <div style="font-size:12px;margin-top:4px;font-weight:bold">${order.paymentMethod==='online'?'Paye en ligne':'Paiement sur place'}</div>
    </div>
    <table style="width:100%;border-collapse:collapse">${items}</table>
    <div style="border-top:2px dashed #000;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between">
      <strong style="font-size:16px">TOTAL</strong><strong style="font-size:16px">${fmt(order.total)}</strong>
    </div>
    <div style="text-align:center;margin-top:20px;font-size:11px;color:#999">Pockly by Stratiq</div>
    <script>setTimeout(()=>{window.print();window.close()},400)<\/script></body></html>`);
  w.document.close();
}

/* ═══════════════════════════════════════════════════════════
   QR CODE (deterministic pattern)
   ═══════════════════════════════════════════════════════════ */
function QRCode({value, size=200}) {
  const s = 25;
  const grid = [];
  let hash = 0;
  for (let i = 0; i < value.length; i++) { hash = ((hash << 5) - hash) + value.charCodeAt(i); hash |= 0; }
  for (let y = 0; y < s; y++) {
    grid[y] = [];
    for (let x = 0; x < s; x++) {
      const inFinder = (x<7&&y<7)||(x>=s-7&&y<7)||(x<7&&y>=s-7);
      const finderBorder = inFinder && (x===0||x===6||y===0||y===6||(x>=s-7&&(x===s-7||x===s-1))||(y>=s-7&&(y===s-7||y===s-1)));
      const finderInner = (x>=2&&x<=4&&y>=2&&y<=4)||(x>=s-5&&x<=s-3&&y>=2&&y<=4)||(x>=2&&x<=4&&y>=s-5&&y<=s-3);
      if (finderBorder || (inFinder && finderInner)) grid[y][x] = 1;
      else if (inFinder) grid[y][x] = 0;
      else { const seed = (hash * ((x+1)*7 + (y+1)*13)) >>> 0; grid[y][x] = seed % 3 === 0 ? 1 : 0; }
    }
  }
  const cell = size / s;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{borderRadius:8}}>
      <rect width={size} height={size} fill="#fff"/>
      {grid.map((row,y) => row.map((c,x) => c ? <rect key={`${x}-${y}`} x={x*cell} y={y*cell} width={cell} height={cell} fill={C.dark} rx={cell*.12}/> : null))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   API NORMALIZATION — convert snake_case (DB) → camelCase (UI)
   ═══════════════════════════════════════════════════════════ */
function normalizeProduct(p) {
  if (!p) return p;
  return {
    id: p.id,
    type: p.type,
    name: p.name,
    description: p.description || "",
    photo: p.photo || "📦",
    category: p.category || "",
    price: p.price !== null && p.price !== undefined ? Number(p.price) : undefined,
    stock: p.stock !== null && p.stock !== undefined ? p.stock : undefined,
    basePrice: p.base_price !== null && p.base_price !== undefined ? Number(p.base_price) : undefined,
    options: p.options || undefined,
    active: p.active !== false,
  };
}

function normalizeOrder(o) {
  if (!o) return o;
  return {
    id: o.id,
    shortId: o.short_id || o.id?.slice(0, 6).toUpperCase(),
    items: o.items || [],
    total: Number(o.total || 0),
    status: o.status,
    date: new Date(o.created_at).toLocaleString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    source: o.source,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email,
    pickupTime: o.pickup_time,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    remarks: o.remarks,
  };
}

function normalizeRestaurant(r) {
  if (!r) return r;
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    phone: r.phone,
    prepTime: r.prep_time || 15,
    open: r.open !== false,
    category: r.category || "",
    emoji: r.emoji || "🍽️",
    photo: r.emoji || "🍽️",                  // backward compat with V8 code
    loyaltyTarget: r.loyalty_target || 6,
    loyaltyReward: r.loyalty_reward || "",
  };
}

function upsertRestaurantList(prev, restaurant) {
  if (!restaurant?.id) return prev;
  const idx = prev.findIndex((entry) => entry.id === restaurant.id);
  if (idx === -1) return [...prev, restaurant];
  const next = [...prev];
  next[idx] = restaurant;
  return next;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ═══════════════════════════════════════════════════════════
   MAIN APP — Two modes: "admin" (auth required) and "client" (no auth)
   ═══════════════════════════════════════════════════════════ */
export default function App() {
  const [mode, setMode] = useState("select"); // select | pickRestaurant | client | admin | adminAuth | merchantOnboarding
  const [adminUser, setAdminUser] = useState(null);
    const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shop, setShop] = useState(SEED_SHOP);
  const [restaurants, setRestaurants] = useState(SEED_RESTAURANTS);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [orderConfirm, setOrderConfirm] = useState(null);
  const [adminTab, setAdminTab] = useState("orders");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevPendingRef = useRef(0);
  const [editProduct, setEditProduct] = useState(null);
  const [clientView, setClientView] = useState("catalog");
  const [selectedProduct, setSelectedProduct] = useState(null);

  /* ─── Bootstrap: restore session + load public restaurants ─── */
  useEffect(() => {
    (async () => {
      try {
        // 1. Restaurants are public, always load them
        const { restaurants: rests } = await restaurantsApi.list();
        setRestaurants((rests || []).map(normalizeRestaurant));
      } catch (e) {
        console.warn("[bootstrap] failed to load restaurants:", e.message);
      }
      // 2. If we have a token, try to restore the user session
      if (auth.getToken()) {
        try {
          const { user } = await authApi.me();
          if (user.role !== "merchant") {
            throw new Error("Merchant role required");
          }
          // Map snake_case → camelCase
          setAdminUser({ ...user, restaurantId: user.restaurantId });
          if (user.restaurantId) {
            try {
              const { restaurant } = await restaurantsApi.get(user.restaurantId);
              const normalizedRestaurant = normalizeRestaurant(restaurant);
              setRestaurants((prev) => upsertRestaurantList(prev, normalizedRestaurant));
              setShop((prev) => ({
                ...prev,
                name: normalizedRestaurant.name,
                address: normalizedRestaurant.address,
                phone: normalizedRestaurant.phone,
                prepTime: normalizedRestaurant.prepTime,
                loyaltyTarget: normalizedRestaurant.loyaltyTarget,
                loyaltyReward: normalizedRestaurant.loyaltyReward,
              }));
            } catch (restaurantError) {
              console.warn("[bootstrap] failed to load merchant restaurant:", restaurantError.message);
            }
          }
        } catch (e) {
          console.warn("[bootstrap] session expired:", e.message);
          auth.clearToken();
        }
      }
      setLoaded(true);
    })();
  }, []);

  /* ─── When admin user is set: fetch their products + orders ─── */
  useEffect(() => {
    if (!loaded || !adminUser?.restaurantId) return;
    (async () => {
      try {
        const [pData, oData] = await Promise.all([
          productsApi.list(adminUser.restaurantId),
          ordersApi.list(),
        ]);
        setProducts((pData?.products || []).map(normalizeProduct));
        setOrders((oData?.orders || []).map(normalizeOrder));
      } catch (e) {
        console.warn("[admin data] failed:", e.message);
      }
    })();
  }, [adminUser, loaded]);

  /* ─── When client picks a restaurant: fetch its products ─── */
  useEffect(() => {
    if (!selectedRestaurant?.id) return;
    (async () => {
      try {
        const { products: prods } = await productsApi.list(selectedRestaurant.id);
        setProducts((prods || []).map(normalizeProduct));
      } catch (e) {
        console.warn("[client products] failed:", e.message);
      }
    })();
  }, [selectedRestaurant]);

  useEffect(() => {
    if (!selectedRestaurant?.id) return;
    const latestRestaurant = restaurants.find((restaurant) => restaurant.id === selectedRestaurant.id);
    if (latestRestaurant && latestRestaurant !== selectedRestaurant) {
      setSelectedRestaurant(latestRestaurant);
    }
  }, [restaurants, selectedRestaurant]);

  /* ─── Auto-refresh orders for admin every 15s (poll) ─── */
  useEffect(() => {
    if (!adminUser?.restaurantId) return;
    const t = setInterval(async () => {
      try {
        const { orders: o } = await ordersApi.list();
        setOrders((o || []).map(normalizeOrder));
      } catch {}
    }, 15000);
    return () => clearInterval(t);
  }, [adminUser]);

  /* Notification sonore quand nouvelle commande pending arrive */
  useEffect(() => {
    if (!loaded || !adminUser) return;
    const pending = orders.filter(o => o.status === "pending").length;
    if (pending > prevPendingRef.current && prevPendingRef.current >= 0) {
      // Son via Web Audio API (pas de fichier externe nécessaire)
      if (soundEnabled) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880; // La5
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start(); osc.stop(ctx.currentTime + 0.4);
          // Deuxième bip plus aigu
          setTimeout(() => {
            const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
            const o2 = ctx2.createOscillator(); const g2 = ctx2.createGain();
            o2.connect(g2); g2.connect(ctx2.destination);
            o2.frequency.value = 1320;
            g2.gain.setValueAtTime(0.15, ctx2.currentTime);
            g2.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.3);
            o2.start(); o2.stop(ctx2.currentTime + 0.3);
          }, 200);
        } catch {}
      }
    }
    prevPendingRef.current = pending;
  }, [orders, loaded, adminUser, soundEnabled]);

  const showToast = m => { setToast(m); setTimeout(() => setToast(null), 2400); };

  const updateStock = (pid, cids, qty) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== pid) return p;
      if (p.type === "unit") return { ...p, stock: Math.max(0, p.stock - qty) };
      return { ...p, options: p.options.map(g => ({ ...g, choices: g.choices.map(c => cids.includes(c.id) ? { ...c, stock: Math.max(0, c.stock - qty) } : c) })) };
    }));
  };

  const placeOrder = async (extra = {}) => {
    if (!cart.length) return false;
    if (!selectedRestaurant?.id) { showToast("Aucun restaurant sélectionné"); return false; }
    for (const item of cart) {
      const p = products.find(x => x.id === item.productId);
      if (p?.type === "unit" && item.qty > p.stock) {
        showToast("Stock insuffisant pour " + p.name);
        return false;
      }
    }
    const total = cart.reduce((s, i) => s + i.totalPrice * i.qty, 0);
    try {
      const { order } = await ordersApi.create({
        restaurantId: selectedRestaurant.id,
        items: cart.map(c => ({ ...c })),
        total,
        customerName: extra.customerName,
        customerPhone: extra.customerPhone,
        customerEmail: extra.customerEmail,
        pickupTime: extra.pickupTime,
        paymentMethod: extra.paymentMethod,
        remarks: extra.remarks,
        source: "platform",
      });
      const norm = normalizeOrder(order);
      setCart([]);
      setOrderConfirm(norm);
      showToast("Commande passée !");
      // Refresh products to reflect stock decrement
      const { products: prods } = await productsApi.list(selectedRestaurant.id);
      setProducts((prods || []).map(normalizeProduct));
      return true;
    } catch (e) {
      showToast("Erreur : " + e.message);
      return false;
    }
  };

  const addToCart = item => {
    const p = products.find(x => x.id === item.productId);
    if (p && p.type === "unit") {
      const inCart = cart.filter(c => c.productId === item.productId).reduce((s,c) => s + c.qty, 0);
      if (inCart + item.qty > p.stock) {
        showToast("Stock insuffisant : " + (p.stock - inCart) + " restant(s)");
        return;
      }
    }
    setCart(prev => [...prev, { ...item, cartId: uid() }]);
    showToast(item.name + " ajouté");
  };
  const removeFromCart = cid => setCart(prev => prev.filter(i => i.cartId !== cid));
  const currentMerchantRestaurant = adminUser?.restaurantId
    ? restaurants.find((restaurant) => restaurant.id === adminUser.restaurantId) || null
    : null;
  const currentAdminShop = currentMerchantRestaurant || shop;
  const currentClientShop = selectedRestaurant || shop;

  if (!loaded) return (
    <><StyleTag/><div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,fontFamily:F.body}}>
      <div style={{width:32,height:32,border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    </div></>
  );

  const ToastEl = toast ? <div style={S.toast}>{toast}</div> : null;

  /* ═══ ORDER CONFIRM MODAL ═══ */
  const ConfirmEl = orderConfirm ? (
    <div style={S.overlay} onClick={() => setOrderConfirm(null)}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{width:64,height:64,borderRadius:"50%",background:C.accentL,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",animation:"pulse .6s ease"}}>
          <I d={IC.check} s={28} c={C.accent}/>
        </div>
        <h2 style={{fontFamily:F.display,fontSize:22,fontWeight:700,color:C.text}}>Commande confirmée !</h2>
        <p style={{fontFamily:F.mono,color:C.muted,fontSize:12,margin:"6px 0",letterSpacing:1}}>#{orderConfirm.shortId || orderConfirm.id?.slice(0, 6)?.toUpperCase()}</p>
        <div style={{fontSize:32,fontWeight:800,color:C.accent,fontFamily:F.display,margin:"8px 0"}}>{fmt(orderConfirm.total)}</div>
        {orderConfirm.pickupTime && <p style={{color:C.textSoft,fontSize:14}}>⏰ Retrait : <strong>{orderConfirm.pickupTime}</strong></p>}
        {orderConfirm.paymentMethod === 'place' && <p style={{color:C.textSoft,fontSize:13,marginTop:4}}>💰 À payer sur place</p>}
        {orderConfirm.paymentMethod === 'online' && <p style={{color:C.success,fontSize:13,marginTop:4,fontWeight:600}}>💳 Payé en ligne</p>}
        {orderConfirm.customerPhone && (
          <div style={{marginTop:14,padding:"12px 14px",background:"#f0fdf4",borderRadius:12,border:"1px solid #bbf7d0",textAlign:"left"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <I d={IC.wa} s={18} c={C.waGreen} f={C.waGreen}/>
              <span style={{fontSize:13,fontWeight:600,color:"#166534"}}>Numéro enregistré pour le suivi WhatsApp</span>
            </div>
            <p style={{fontSize:12,color:"#15803d",margin:0,lineHeight:1.5}}>
              Le numéro <strong>{orderConfirm.customerPhone}</strong> a bien été associé à la commande pour le suivi WhatsApp.
            </p>
          </div>
        )}
        <button style={{...S.btnS,marginTop:12,width:"100%",justifyContent:"center"}} onClick={() => setOrderConfirm(null)}>Fermer</button>
      </div>
    </div>
  ) : null;

  /* ═══════════════════════════════════════════════════
     MODE SELECT — Stratiq landing
     ═══════════════════════════════════════════════════ */
  if (mode === "select") return (
    <><StyleTag/>
      <div style={{minHeight:"100vh",background:C.bg,fontFamily:F.body,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
        <div style={{textAlign:"center",marginBottom:40,animation:"fadeUp .5s ease"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:44,height:44,borderRadius:14,background:`linear-gradient(135deg,${C.accent},${C.accentH})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:22,fontWeight:800}}>S</div>
            <span style={{fontSize:28,fontWeight:800,color:C.text}}>Stratiq</span>
          </div>
          <p style={{color:C.muted,fontSize:15,maxWidth:360,margin:"0 auto",lineHeight:1.6}}>Solutions digitales pour commerçants.<br/><strong style={{color:C.accent}}>Pockly</strong> — Commande en ligne pour restaurants.</p>
        </div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center",animation:"fadeUp .5s ease .15s both"}}>
          <button style={S.modeCard} onClick={() => setMode("pickRestaurant")}
            onMouseEnter={e => {e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 16px 40px ${C.glow}`}}
            onMouseLeave={e => {e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=`0 4px 16px rgba(0,0,0,.05)`}}>
            <span style={{fontSize:40}}>🛒</span>
            <strong style={{fontSize:16,color:C.text}}>Commander</strong>
            <span style={{fontSize:13,color:C.muted}}>Voir le menu et commander</span>
          </button>
          <button style={S.modeCard} onClick={() => setMode("adminAuth")}
            onMouseEnter={e => {e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 16px 40px ${C.glow}`}}
            onMouseLeave={e => {e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=`0 4px 16px rgba(0,0,0,.05)`}}>
            <span style={{fontSize:40}}>🏪</span>
            <strong style={{fontSize:16,color:C.text}}>Espace commerçant</strong>
            <span style={{fontSize:13,color:C.muted}}>Gérer produits et commandes</span>
          </button>
        </div>
      </div>
    </>
  );

  /* ═══════════════════════════════════════════════════
     ADMIN AUTH
     ═══════════════════════════════════════════════════ */
  if (mode === "adminAuth" && !adminUser) return (
    <><StyleTag/>
      <AdminAuth onLogin={u => { setAdminUser(u); setMode(u.restaurantId ? "admin" : "merchantOnboarding"); }} onBack={() => setMode("select")}/>
    </>
  );

  /* ═══════════════════════════════════════════════════
     MERCHANT ONBOARDING (1er restaurant à la création)
     ═══════════════════════════════════════════════════ */
  if (mode === "merchantOnboarding" && adminUser) return (
    <><StyleTag/>{ToastEl}
      <MerchantOnboarding
        user={adminUser}
        onCreate={async (restaurantData) => {
          try {
            const { restaurant, token } = await restaurantsApi.create(restaurantData);
            // Update token (now contains restaurantId)
            if (token) auth.setToken(token);
            const norm = normalizeRestaurant(restaurant);
            setRestaurants(prev => upsertRestaurantList(prev, norm));
            const updatedUser = { ...adminUser, restaurantId: norm.id };
            setAdminUser(updatedUser);
            setShop(s => ({ ...s, name: norm.name, address: norm.address, phone: norm.phone, prepTime: norm.prepTime }));
            setMode("admin");
            showToast("Établissement créé avec succès !");
          } catch (e) {
            showToast("Erreur : " + e.message);
          }
        }}
        onLogout={() => { auth.clearToken(); setAdminUser(null); setMode("select"); }}
      />
    </>
  );

  /* ═══════════════════════════════════════════════════
     RESTAURANT PICKER (Point 5)
     ═══════════════════════════════════════════════════ */
  if (mode === "pickRestaurant") return (
    <><StyleTag/>
      <div style={{minHeight:"100vh",background:C.bg,fontFamily:F.body,padding:"24px 16px"}}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <button style={S.ghostBtn} onClick={() => setMode("select")}><I d={IC.back} s={18}/></button>
          <h2 style={{fontFamily:F.display,fontSize:24,fontWeight:800,color:C.text,margin:"16px 0 8px"}}>Choisissez un établissement</h2>
          <p style={{color:C.muted,fontSize:14,marginBottom:20}}>Sélectionnez le restaurant où vous souhaitez commander.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {restaurants.map((r, i) => (
              <button key={r.id} disabled={!r.open}
                style={{...S.card,display:"flex",alignItems:"center",gap:14,padding:16,cursor:r.open?"pointer":"default",opacity:r.open?1:.5,textAlign:"left",transition:"all .2s",animation:`fadeUp .3s ease ${i*60}ms both`}}
                onClick={() => {
                  if (r.open) {
                    setSelectedRestaurant(r);
                    setSelectedProduct(null);
                    setClientView("catalog");
                    setCart([]);
                    setMode("client");
                  }
                }}>
                <div style={{width:48,height:48,borderRadius:14,background:C.accentL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🏪</div>
                <div style={{flex:1}}>
                  <h3 style={{fontSize:15,fontWeight:700,color:C.text,margin:0}}>{r.name}</h3>
                  <p style={{fontSize:13,color:C.muted,margin:"2px 0 0"}}>{r.address}</p>
                  <span style={{fontSize:12,color:C.success,fontWeight:600}}>~{r.prepTime} min</span>
                </div>
                <span style={{...S.pill,background:r.open?C.successL:C.dangerL,color:r.open?C.success:C.danger}}>{r.open?"Ouvert":"Fermé"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  /* ═══════════════════════════════════════════════════
     ADMIN DASHBOARD
     ═══════════════════════════════════════════════════ */
  if (mode === "admin" && adminUser) return (
    <><StyleTag/>{ToastEl}{ConfirmEl}
      <div style={{minHeight:"100vh",background:C.bg,fontFamily:F.body}}>
        <header className="admin-header" style={S.header}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,borderRadius:10,background:`linear-gradient(135deg,${C.accent},${C.accentH})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:800}}>P</div>
            <span style={{fontFamily:F.display,fontSize:17,fontWeight:700,color:C.text}}>Pockly</span>
            <span style={{fontSize:10,background:C.accent,color:"#fff",padding:"2px 8px",borderRadius:20,fontWeight:600}}>Pro</span>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:12}}>
            <button style={{...S.ghostBtn,opacity:soundEnabled?1:.4}} onClick={() => setSoundEnabled(s => !s)} title={soundEnabled ? "Désactiver le son" : "Activer le son"}>
              <span style={{fontSize:18}}>{soundEnabled ? "🔔" : "🔕"}</span>
            </button>
            <span style={{fontSize:13,color:C.muted}}>{adminUser.name}</span>
            <button style={S.ghostBtn} onClick={() => { auth.clearToken(); setAdminUser(null); setMode("select"); }}><I d={IC.logout} s={17} c={C.muted}/></button>
          </div>
        </header>
        <nav className="admin-nav" style={S.nav}>
          {[
            {k:"orders",l:"Commandes",i:IC.orders,badge:orders.filter(o=>o.status==="pending").length},
            {k:"products",l:"Produits",i:IC.box},
            {k:"loyalty",l:"Fidélité",i:IC.gift},
            {k:"analytics",l:"Analytics",i:IC.chart},
            {k:"qrcode",l:"QR Code",i:IC.qr},
            {k:"settings",l:"Config",i:IC.settings},
          ].map(t => (
            <button key={t.k} style={{...S.navBtn,...(adminTab===t.k?S.navA:{})}} onClick={() => { setAdminTab(t.k); setEditProduct(null); }}>
              <I d={t.i} s={15}/><span>{t.l}</span>
              {t.badge > 0 && <span style={S.navBadge}>{t.badge}</span>}
            </button>
          ))}
        </nav>
        <main className="main-wrap" style={S.main}>
          {adminTab==="orders" && <AdminOrders orders={orders} setOrders={setOrders} shopName={currentAdminShop.name} showToast={showToast}/>}
          {adminTab==="products" && !editProduct && <AdminProducts products={products} setProducts={setProducts} onEdit={setEditProduct} showToast={showToast}/>}
          {adminTab==="products" && editProduct && <ProductEditor product={editProduct} onSave={async (p) => {
            try {
              const isNew = !products.find(x => x.id === p.id);
              const payload = {
                type: p.type,
                name: p.name,
                description: p.description,
                photo: p.photo,
                category: p.category,
                price: p.price,
                stock: p.stock,
                basePrice: p.basePrice,
                options: p.options,
              };
              const result = isNew
                ? await productsApi.create(payload)
                : await productsApi.update(p.id, payload);
              const saved = normalizeProduct(result.product);
              setProducts(prev => {
                const i = prev.findIndex(x => x.id === saved.id);
                if (i >= 0) { const n = [...prev]; n[i] = saved; return n; }
                return [...prev, saved];
              });
              setEditProduct(null);
              showToast("Sauvegardé !");
            } catch (e) {
              showToast("Erreur : " + e.message);
            }
          }} onCancel={() => setEditProduct(null)}/>}
          {adminTab==="loyalty" && <LoyaltyPanel orders={orders} shop={currentAdminShop}/>}
          {adminTab==="analytics" && <Analytics orders={orders}/>}
          {adminTab==="qrcode" && <QRPanel shop={currentAdminShop} restaurants={currentMerchantRestaurant ? [currentMerchantRestaurant] : []}/>}
          {adminTab==="settings" && <ShopSettings shop={shop} setShop={setShop} restaurants={restaurants} setRestaurants={setRestaurants} adminUser={adminUser} setAdminUser={setAdminUser}/>}
        </main>
      </div>
    </>
  );

  /* ═══════════════════════════════════════════════════
     CLIENT STOREFRONT — No auth required
     ═══════════════════════════════════════════════════ */
  const cartTotal = cart.reduce((s,i) => s + i.totalPrice * i.qty, 0);
  const cartCount = cart.reduce((s,i) => s + i.qty, 0);

  return (
    <><StyleTag/>{ToastEl}{ConfirmEl}
      <div style={{minHeight:"100vh",background:C.bg,fontFamily:F.body}}>
        {/* Header */}
        <header style={S.clientH}>
          {clientView !== "catalog" && <button style={S.ghostBtn} onClick={() => { setClientView("catalog"); setSelectedProduct(null); }}><I d={IC.back} s={18}/></button>}
          <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:26,height:26,borderRadius:8,background:`linear-gradient(135deg,${C.accent},${C.accentH})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800}}>P</div>
            <span style={{fontFamily:F.display,fontSize:16,fontWeight:700,color:C.text}}>Pockly</span>
          </div>
          <button style={{...S.ghostBtn,position:"relative"}} onClick={() => setClientView("cart")}>
            <I d={IC.cart} s={22} c={C.text}/>
            {cartCount > 0 && <span style={S.cartBadge}>{cartCount}</span>}
          </button>
          <button style={S.ghostBtn} onClick={() => { setMode("select"); setCart([]); setClientView("catalog"); setSelectedProduct(null); }}>
            <I d={IC.x} s={17} c={C.muted}/>
          </button>
        </header>

        {/* Shop info banner */}
        {clientView === "catalog" && !selectedProduct && (
          <div style={{background:C.surface,borderBottom:`1px solid ${C.borderL}`,padding:"14px 20px"}}>
            <h2 style={{fontFamily:F.display,fontSize:20,fontWeight:800,color:C.text,margin:0}}>{currentClientShop.name}</h2>
            <div className="shop-meta" style={{display:"flex",gap:16,marginTop:6,flexWrap:"wrap"}}>
              <span style={{fontSize:13,color:C.textSoft,display:"flex",alignItems:"center",gap:4}}><I d={IC.mapPin} s={14} c={C.muted}/>{currentClientShop.address}</span>
              <span style={{fontSize:13,color:C.textSoft,display:"flex",alignItems:"center",gap:4}}><I d={IC.phone} s={14} c={C.muted}/>{currentClientShop.phone}</span>
              <span style={{fontSize:13,color:C.success,display:"flex",alignItems:"center",gap:4,fontWeight:600}}><I d={IC.clock} s={14} c={C.success}/> ~{currentClientShop.prepTime || 15} min</span>
            </div>
          </div>
        )}

        {/* CATALOG */}
        {clientView === "catalog" && !selectedProduct && (
          <div style={{maxWidth:820,margin:"0 auto",padding:"16px 16px 40px"}}>
            <div className="grid-products" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
              {products.map((p, idx) => {
                const oos = p.type === "unit" && p.stock === 0;
                return (
                  <div key={p.id} style={{...S.cCard,opacity:oos?.4:1,animation:`fadeUp .35s ease ${idx*50}ms both`}}>
                    <div style={{fontSize:40,padding:"18px 0",textAlign:"center",background:C.surfaceAlt,borderBottom:`1px solid ${C.borderL}`,cursor:p.type==="composable"?"pointer":"default"}}
                      onClick={() => { if (p.type==="composable" && !oos) { setSelectedProduct(p); setClientView("detail"); } }}>
                      {p.photo}
                    </div>
                    <div style={{padding:"10px 12px 12px",flex:1,display:"flex",flexDirection:"column"}}>
                      <h3 style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:2}}>{p.name}</h3>
                      <p style={{fontSize:11,color:C.muted,lineHeight:1.4,flex:1,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.description}</p>

                      {/* UNIT: price + quick add inline */}
                      {p.type === "unit" && (
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                          <div>
                            <span style={{fontSize:16,fontWeight:700,color:C.accent}}>{fmt(p.price)}</span>
                            <span style={{fontSize:11,color:oos?C.danger:C.success,marginLeft:6,fontWeight:600}}>{oos ? "Épuisé" : `${p.stock} en stock`}</span>
                          </div>
                          {!oos && (() => {
                            const inCart = cart.filter(c => c.productId === p.id).reduce((s,c) => s+c.qty, 0);
                            const avail = p.stock - inCart;
                            return avail > 0
                              ? <QuickAdd maxQty={avail} onAdd={qty => addToCart({productId:p.id,name:p.name,qty,totalPrice:p.price,choiceIds:[],details:null})}/>
                              : <span style={{fontSize:11,color:"#92400e",fontWeight:600}}>Max atteint</span>;
                          })()}
                        </div>
                      )}

                      {/* COMPOSABLE: price + "Composer" button */}
                      {p.type === "composable" && (
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                          <span style={{fontSize:16,fontWeight:700,color:C.accent}}>Dès {fmt(p.basePrice)}</span>
                          <button style={{padding:"6px 14px",borderRadius:10,background:C.accent,color:"#fff",fontSize:12,fontWeight:600}}
                            onClick={() => { setSelectedProduct(p); setClientView("detail"); }}>Composer</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRODUCT DETAIL (composable) */}
        {clientView === "detail" && selectedProduct && (
          <ProductDetail product={selectedProduct} onAdd={item => { addToCart(item); setClientView("catalog"); setSelectedProduct(null); }}/>
        )}

        {/* CART */}
        {clientView === "cart" && (
          <CartView cart={cart} total={cartTotal} count={cartCount} shop={currentClientShop}
            onRemove={removeFromCart} onBack={() => setClientView("catalog")}
            onPlaceOrder={placeOrder}/>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   QUICK ADD (inline +/- on product card for unit products)
   ═══════════════════════════════════════════════════════════ */
function QuickAdd({ onAdd, maxQty = 999 }) {
  const [qty, setQty] = useState(0);
  const [open, setOpen] = useState(false);

  if (!open) return (
    <button onClick={() => { setQty(1); setOpen(true); }}
      style={{width:34,height:34,borderRadius:10,background:C.accent,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,transition:"all .15s"}}>+</button>
  );

  return (
    <div style={{display:"flex",alignItems:"center",gap:4,animation:"fadeUp .2s ease"}}>
      <button onClick={() => { if (qty <= 1) { setOpen(false); setQty(0); } else setQty(q => q-1); }}
        style={{width:30,height:30,borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,fontSize:16,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",color:C.text}}>−</button>
      <span style={{fontSize:14,fontWeight:700,minWidth:20,textAlign:"center",color:C.text}}>{qty}</span>
      <button onClick={() => setQty(q => Math.min(maxQty, q+1))} disabled={qty>=maxQty}
        style={{width:30,height:30,borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,fontSize:16,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",color:C.text}}>+</button>
      <button onClick={() => { onAdd(qty); setOpen(false); setQty(0); }}
        style={{padding:"5px 10px",borderRadius:8,background:C.accent,color:"#fff",fontSize:12,fontWeight:600,marginLeft:2}}>OK</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CART VIEW — checkout kept minimal (name + phone only)
   ═══════════════════════════════════════════════════════════ */
function CartView({ cart, total, count, shop, onRemove, onBack, onPlaceOrder }) {
  const [step, setStep] = useState("cart"); // cart | checkout
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("BE");
  const [processing, setProcessing] = useState(false);

  const phoneDigits = stripLeading0(phone.replace(/\D/g,''));
  const phoneIsValid = validPhone(phone, phoneCountry);
  const fullPhone = phoneDigits.length > 0 ? (COUNTRIES.find(c=>c.code===phoneCountry)?.dial || "") + phoneDigits : "";
  const phoneErr = phoneDigits.length > 0 && !phoneIsValid;

  const doConfirm = async () => {
    if (!name.trim()) return;
    if (phoneDigits.length > 0 && !phoneIsValid) return;
    setProcessing(true);
    await sleep(400);
    const success = await onPlaceOrder({
        customerName: name.trim(),
        customerPhone: fullPhone || null,
      });
    if (success !== false) {
      setStep("cart");
      setName(""); setPhone("");
    }
    setProcessing(false);
  };

  if (!count) return (
    <div style={{maxWidth:500,margin:"0 auto",padding:"40px 16px",textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:12}}>🛒</div>
      <p style={{color:C.muted,fontSize:15,marginBottom:16}}>Votre panier est vide</p>
      <button style={S.btnP} onClick={onBack}>Voir les produits</button>
    </div>
  );

  if (step === "checkout") return (
    <div style={{maxWidth:520,margin:"0 auto",padding:"20px 16px 40px",animation:"fadeUp .3s ease"}}>
      <h2 style={{fontFamily:F.display,fontSize:20,fontWeight:700,marginBottom:16}}>Finaliser</h2>

      {/* Recap */}
      <div style={{background:C.surfaceAlt,borderRadius:12,padding:"12px 14px",marginBottom:18,border:`1px solid ${C.borderL}`}}>
        {cart.map(item => (
          <div key={item.cartId} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:13}}>
            <span style={{color:C.text}}>{item.qty}× {item.name}</span>
            <span style={{fontWeight:600,color:C.text}}>{fmt(item.totalPrice * item.qty)}</span>
          </div>
        ))}
        <div style={{borderTop:`1px solid ${C.border}`,marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontWeight:700,fontSize:15}}>Total</span>
          <span style={{fontWeight:800,fontSize:20,color:C.accent}}>{fmt(total)}</span>
        </div>
      </div>

      {/* Name + Phone with country selector */}
      <div className="checkout-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <label style={{display:"block"}}>
          <span style={{fontSize:13,fontWeight:600,color:C.text}}>Nom *</span>
          <input style={{...S.inp,marginTop:4}} value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont"/>
        </label>
        <div>
          <span style={{fontSize:13,fontWeight:600,color:C.text}}>Téléphone <span style={{fontWeight:400,color:C.muted}}>(WhatsApp)</span></span>
          <div style={{display:"flex",gap:4,marginTop:4}}>
            <select value={phoneCountry} onChange={e => setPhoneCountry(e.target.value)}
              style={{padding:"9px 4px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,fontFamily:F.body,background:C.surface,color:C.text,minWidth:95,cursor:"pointer"}}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>)}
            </select>
            <div style={{flex:1,position:"relative"}}>
              <input style={{...S.inp,borderColor:phoneErr?C.danger:C.border}} value={phone}
                inputMode="numeric" pattern="[0-9]*"
                onChange={e => setPhone(e.target.value.replace(/[^0-9]/g,'').replace(/^0+/, ''))}
                placeholder={COUNTRIES.find(c=>c.code===phoneCountry)?.len.join(' ou ')+' chiffres'}/>
              {phoneErr ? <div style={{fontSize:11,color:C.danger,marginTop:2,fontWeight:500}}>
                {COUNTRIES.find(c=>c.code===phoneCountry)?.len.join(" ou ")} chiffres requis pour {phoneCountry}
              </div> : <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                Sans le 0 initial — ex : 470 12 34 56
              </div>}
            </div>
          </div>
        </div>
      </div>
      <button style={{...S.btnP,width:"100%",justifyContent:"center",padding:"14px 0",fontSize:16,opacity:(name.trim()&&!phoneErr)?1:.5}} onClick={doConfirm} disabled={processing || !name.trim() || phoneErr}>
        {processing ? <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:20,height:20,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>Confirmation...</div>
        : `Confirmer · ${fmt(total)}`}
      </button>
      {fullPhone && phoneIsValid && <p style={{textAlign:"center",fontSize:12,color:C.success,marginTop:10,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
        <I d={IC.wa} s={14} c={C.waGreen} f={C.waGreen}/> Numéro transmis pour le suivi WhatsApp : {fullPhone}
      </p>}
    </div>
  );

  // Cart view
  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"20px 16px 40px"}}>
      <h2 style={{fontFamily:F.display,fontSize:20,fontWeight:700,marginBottom:14}}>Panier ({count})</h2>
      {cart.map(item => (
        <div key={item.cartId} style={{display:"flex",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.borderL}`}}>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:C.text}}>{item.qty}× {item.name}</div>
            {item.details && <div style={{fontSize:12,color:C.muted,marginTop:2}}>{item.details}</div>}
          </div>
          <span style={{fontSize:15,fontWeight:700,color:C.accent,marginRight:12}}>{fmt(item.totalPrice * item.qty)}</span>
          <button style={S.ghostBtn} onClick={() => onRemove(item.cartId)}><I d={IC.x} s={16} c={C.danger}/></button>
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0"}}>
        <span style={{fontSize:16,fontWeight:600}}>Total</span>
        <span style={{fontSize:26,fontWeight:800,color:C.accent,fontFamily:F.display}}>{fmt(total)}</span>
      </div>
      <button style={{...S.btnP,width:"100%",justifyContent:"center",padding:"14px 0",fontSize:16}} onClick={() => setStep("checkout")}>
        Passer commande · {fmt(total)}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PRODUCT DETAIL (Composable only — units use quick-add)
   ═══════════════════════════════════════════════════════════ */
function ProductDetail({ product, onAdd }) {
  const [qty, setQty] = useState(1);
  const [sel, setSel] = useState({});
  const selSingle = (gi,cid) => setSel(p => ({...p,[gi]:cid}));
  const togMulti = (gi,cid,max) => setSel(p => { const c=p[gi]||[]; if(c.includes(cid)) return {...p,[gi]:c.filter(id=>id!==cid)}; if(max&&c.length>=max) return p; return {...p,[gi]:[...c,cid]}; });

  const allValid = product.options.every((g,gi) => { if(!g.required) return true; const s=sel[gi]; return g.type==="single" ? !!s : s&&s.length>0; });
  const price = (() => { let p=product.basePrice; product.options.forEach((g,gi)=>{ const s=sel[gi]; if(!s) return; if(g.type==="single"){ const c=g.choices.find(c=>c.id===s); if(c) p+=c.priceDelta; } else s.forEach(id=>{ const c=g.choices.find(c=>c.id===id); if(c) p+=c.priceDelta; }); }); return p; })();
  const getIds = () => { const ids=[]; product.options.forEach((g,gi)=>{ const s=sel[gi]; if(!s) return; if(g.type==="single") ids.push(s); else s.forEach(id=>ids.push(id)); }); return ids; };
  const getDet = () => { const parts=[]; product.options.forEach((g,gi)=>{ const s=sel[gi]; if(!s) return; if(g.type==="single"){ const c=g.choices.find(c=>c.id===s); if(c) parts.push(c.name); } else { const n=s.map(id=>g.choices.find(c=>c.id===id)?.name).filter(Boolean); if(n.length) parts.push(n.join(", ")); } }); return parts.join(" · "); };

  return (
    <div style={{maxWidth:560,margin:"0 auto",animation:"fadeUp .3s ease"}}>
      <div style={{textAlign:"center",padding:"24px 0",background:C.surfaceAlt}}><span style={{fontSize:64}}>{product.photo}</span></div>
      <div style={{padding:20}}>
        <h2 style={{fontFamily:F.display,fontSize:22,fontWeight:800,color:C.text}}>{product.name}</h2>
        <p style={{color:C.muted,fontSize:14,margin:"6px 0 12px",lineHeight:1.5}}>{product.description}</p>
        <div style={{fontSize:22,fontWeight:700,color:C.accent}}>Dès {fmt(product.basePrice)}</div>

        {product.options.map((g,gi) => (
          <div key={gi} style={{margin:"16px 0",paddingBottom:12,borderBottom:`1px solid ${C.borderL}`}}>
            <h3 style={{fontSize:14,fontWeight:700,marginBottom:6,color:C.text}}>
              {g.groupName}{g.required && <span style={{color:C.danger}}> *</span>}
              {g.type==="multi" && g.maxSelect && <span style={{fontWeight:400,fontSize:12,color:C.muted}}> (max {g.maxSelect})</span>}
            </h3>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {g.choices.map(c => {
                const oos = c.stock === 0;
                const isSel = g.type==="single" ? sel[gi]===c.id : (sel[gi]||[]).includes(c.id);
                return (
                  <button key={c.id} disabled={oos}
                    onClick={() => { if(oos) return; g.type==="single" ? selSingle(gi,c.id) : togMulti(gi,c.id,g.maxSelect); }}
                    style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",
                      border:`2px solid ${isSel?C.accent:C.border}`,borderRadius:11,background:isSel?C.accentXL:C.surface,
                      opacity:oos?.35:1,cursor:oos?"not-allowed":"pointer",transition:"all .15s",fontFamily:F.body,textAlign:"left"}}>
                    <span style={{fontSize:13,fontWeight:600,color:C.text}}>{c.name}</span>
                    <span style={{fontSize:11,color:C.muted}}>
                      {c.priceDelta>0?`+${fmt(c.priceDelta)}`:c.priceDelta===0?"Inclus":fmt(c.priceDelta)}
                      {oos && " · Épuisé"}{!oos && c.stock<=5 && ` · ${c.stock} restants`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,margin:"14px 0"}}>
          <button style={S.qtyBtn} onClick={() => setQty(q => Math.max(1,q-1))}>−</button>
          <span style={{fontSize:20,fontWeight:700,minWidth:32,textAlign:"center",color:C.text}}>{qty}</span>
          <button style={S.qtyBtn} onClick={() => setQty(q => q+1)}>+</button>
        </div>
        <button disabled={!allValid} style={{...S.btnP,width:"100%",justifyContent:"center",padding:"14px 0",fontSize:16,opacity:allValid?1:.4}}
          onClick={() => { if(!allValid) return; onAdd({productId:product.id,name:product.name,qty,totalPrice:price,choiceIds:getIds(),details:getDet()}); }}>
          {allValid ? `Ajouter · ${fmt(price * qty)}` : "Complétez vos choix"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADMIN AUTH
   ═══════════════════════════════════════════════════════════ */
function AdminAuth({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    setError("");
    if (!email || !password) return setError("Remplissez tous les champs");
    setLoading(true);
    try {
      const { user, token } = await authApi.login({ email: email.trim().toLowerCase(), password });
      if (user.role !== "merchant") {
        throw new Error("Ce compte n'est pas un compte commerçant");
      }
      auth.setToken(token);
      onLogin(user);
    } catch (e) {
      auth.clearToken();
      setError(e.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  const doSignup = async () => {
    setError("");
    if (!name || !email || !password) return setError("Remplissez tous les champs");
    if (password.length < 4) return setError("Min 4 caractères");
    setLoading(true);
    try {
      const { user, token } = await authApi.signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "merchant",
      });
      auth.setToken(token);
      onLogin(user);
    } catch (e) {
      setError(e.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,fontFamily:F.body,padding:20}}>
      <div style={{width:"100%",maxWidth:380,background:C.surface,borderRadius:24,padding:"36px 32px",boxShadow:`0 8px 40px ${C.glow}`,border:`1px solid ${C.borderL}`,animation:"fadeUp .5s ease"}}>
        <button style={{...S.ghostBtn,marginBottom:12}} onClick={onBack}><I d={IC.back} s={18}/></button>
        <h2 style={{fontFamily:F.display,fontSize:22,fontWeight:700,color:C.text,marginBottom:4}}>{mode==="login"?"Connexion commerçant":"Créer un compte"}</h2>
        <p style={{color:C.muted,fontSize:14,marginBottom:20}}>Espace réservé aux commerçants</p>
        {error && <div style={{background:C.dangerL,color:C.danger,padding:"10px 14px",borderRadius:12,fontSize:13,fontWeight:500,marginBottom:14}}>{error}</div>}
        {mode==="signup" && <label style={S.authLbl}>Nom<input style={S.inp} value={name} onChange={e => setName(e.target.value)} placeholder="Nom de votre commerce"/></label>}
        <label style={S.authLbl}>Email<input style={S.inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@exemple.com"/></label>
        <label style={S.authLbl}>Mot de passe
          <div style={{display:"flex",alignItems:"center",gap:0,position:"relative"}}>
            <input style={S.inp} type={showPw?"text":"password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key==="Enter" && (mode==="login"?doLogin():doSignup())}/>
            <button style={{position:"absolute",right:10,background:"none",padding:4}} onClick={() => setShowPw(!showPw)}><I d={showPw?IC.eyeOff:IC.eye} s={16} c={C.muted}/></button>
          </div>
        </label>
        <button style={{...S.btnP,width:"100%",justifyContent:"center",padding:"13px 0",fontSize:15,marginTop:8}} onClick={mode==="login"?doLogin:doSignup} disabled={loading}>
          {loading ? <div style={{width:20,height:20,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> : mode==="login"?"Se connecter":"Créer mon compte"}
        </button>
        <p style={{textAlign:"center",fontSize:13,color:C.muted,marginTop:16}}>
          {mode==="login"?"Pas de compte ? ":"Déjà inscrit ? "}
          <button style={{background:"none",color:C.accent,fontWeight:600,textDecoration:"underline",fontSize:13,padding:0}} onClick={() => { setMode(mode==="login"?"signup":"login"); setError(""); }}>
            {mode==="login"?"S'inscrire":"Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MERCHANT ONBOARDING — 1er établissement à la création
   ═══════════════════════════════════════════════════════════ */
function MerchantOnboarding({ user, onCreate, onLogout }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("BE");
  const [phone, setPhone] = useState("");
  const [prepTime, setPrepTime] = useState(15);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dial = COUNTRIES.find(c => c.code === phoneCountry)?.dial || "";
  const phoneOk = validPhone(phone, phoneCountry) && phone.length > 0;

  const submit = () => {
    setError("");
    if (!name.trim()) return setError("Le nom de l'\u00e9tablissement est requis");
    if (!address.trim()) return setError("L'adresse est requise");
    if (!phoneOk) return setError("Num\u00e9ro de t\u00e9l\u00e9phone invalide");
    if (!prepTime || prepTime < 1) return setError("Temps de pr\u00e9paration invalide");
    setSubmitting(true);
    setTimeout(() => {
      onCreate({
        name: name.trim(),
        address: address.trim(),
        phone: dial + phone,
        prepTime: parseInt(prepTime) || 15,
        open: true,
      });
    }, 300);
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:F.body,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="auth-card" style={{width:"100%",maxWidth:480,background:C.surface,borderRadius:24,padding:"36px 32px",boxShadow:`0 8px 40px ${C.glow}`,border:`1px solid ${C.borderL}`,animation:"fadeUp .5s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:11,fontWeight:700,color:C.accent,background:C.accentL,padding:"4px 12px",borderRadius:20}}>
            <span>👋</span> Bienvenue {user.name}
          </div>
          <button style={{...S.ghostBtn,color:C.muted,fontSize:12}} onClick={onLogout} title="Se d\u00e9connecter">
            <I d={IC.back} s={16}/>
          </button>
        </div>
        <h2 style={{fontFamily:F.display,fontSize:24,fontWeight:800,color:C.text,marginBottom:6}}>Configurez votre établissement</h2>
        <p style={{color:C.muted,fontSize:14,marginBottom:22,lineHeight:1.5}}>Plus qu'une étape : remplissez les infos de votre commerce pour que vos clients puissent commander.</p>

        {error && <div style={{background:C.dangerL,color:C.danger,padding:"10px 14px",borderRadius:12,fontSize:13,fontWeight:500,marginBottom:14}}>{error}</div>}

        <label style={S.authLbl}>
          Nom de votre commerce *
          <input style={S.inp} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Boulangerie du Coin"/>
        </label>

        <label style={S.authLbl}>
          Adresse complète *
          <input style={S.inp} value={address} onChange={e => setAddress(e.target.value)} placeholder="Rue, numéro, code postal, ville"/>
        </label>

        <div>
          <span style={{fontSize:13,fontWeight:600,color:C.text}}>Téléphone du commerce *</span>
          <div style={{display:"flex",gap:4,marginTop:4,marginBottom:14}}>
            <select value={phoneCountry} onChange={e => setPhoneCountry(e.target.value)}
              style={{padding:"9px 4px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,fontFamily:F.body,background:C.surface,color:C.text,minWidth:95,cursor:"pointer"}}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>)}
            </select>
            <input style={{...S.inp,flex:1}} value={phone}
              inputMode="numeric" pattern="[0-9]*"
              onChange={e => setPhone(e.target.value.replace(/[^0-9]/g,'').replace(/^0+/, ''))}
              placeholder={(COUNTRIES.find(c => c.code === phoneCountry)?.len.join(' ou ') || '') + ' chiffres'}/>
          </div>
        </div>

        <label style={S.authLbl}>
          Temps de préparation moyen (en minutes) *
          <input style={S.inp} type="number" min="1" max="120" value={prepTime} onChange={e => setPrepTime(parseInt(e.target.value) || 15)}/>
        </label>

        <button style={{...S.btnP,width:"100%",justifyContent:"center",padding:"13px 0",fontSize:15,marginTop:14}}
          onClick={submit} disabled={submitting}>
          {submitting ? <div style={{width:20,height:20,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> : "Créer mon établissement →"}
        </button>

        <p style={{fontSize:12,color:C.muted,marginTop:14,textAlign:"center",lineHeight:1.5}}>
          Vous pourrez modifier ces informations à tout moment dans les paramètres.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADMIN ORDERS
   ═══════════════════════════════════════════════════════════ */
function AdminOrders({ orders, setOrders, shopName, showToast }) {
  const sc = {pending:{c:"#92400e",bg:"#fef3c7"},preparing:{c:C.accent,bg:C.accentL},ready:{c:C.success,bg:C.successL},done:{c:C.muted,bg:C.surfaceAlt}};
  return (
    <div>
      <h2 style={{fontFamily:F.display,fontSize:22,fontWeight:700,marginBottom:16}}>Commandes ({orders.length})</h2>
      {!orders.length ? <div style={{textAlign:"center",padding:"50px 0",color:C.muted}}><div style={{fontSize:48}}>📋</div><p style={{marginTop:8}}>Aucune commande</p></div>
      : <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {orders.map((o,idx) => {
          const s = sc[o.status] || sc.pending;
          return (
            <div key={o.id} style={{...S.card,animation:`slideIn .3s ease ${idx*40}ms both`,borderLeft:`4px solid ${s.c}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontFamily:F.mono,fontSize:12,fontWeight:700,color:C.accent,letterSpacing:.5}}>#{o.shortId || o.id?.slice(0, 6)?.toUpperCase()}</span>
                  {o.customerName && <span style={{fontSize:13,fontWeight:600,color:C.text}}>{o.customerName}</span>}
                  {o.customerPhone && <span style={{fontSize:12,color:C.muted}}>{o.customerPhone}</span>}
                  {o.paymentMethod && <span style={{...S.pill,fontSize:10,background:o.paymentMethod==="online"?C.successL:"#fef3c7",color:o.paymentMethod==="online"?C.success:"#92400e"}}>{o.paymentMethod==="online"?"💳 Payé":"💰 Sur place"}</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12,color:C.muted}}>{o.date}</span>
                  {o.pickupTime && <span style={{...S.pill,fontSize:10,background:C.accentL,color:C.accent}}>⏰ {o.pickupTime}</span>}
                  <button style={S.iconBtn} title="Imprimer le ticket" onClick={() => printReceipt(o,shopName)}><I d={IC.print} s={14} c={C.accent}/></button>
                  {o.customerPhone && (() => {
                    const replyUrl = buildWaUrl(o.customerPhone, buildMerchantReplyMessage(o, o.status));
                    return replyUrl ? (
                      <a href={replyUrl} target="_blank" rel="noopener noreferrer"
                        style={{...S.iconBtn,display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none"}}
                        title={`Répondre à ${o.customerName || "ce client"} sur WhatsApp`}>
                        <I d={IC.wa} s={14} c={C.waGreen} f={C.waGreen}/>
                      </a>
                    ) : null;
                  })()}
                </div>
              </div>
              {o.remarks && <div style={{fontSize:12,color:C.textSoft,marginBottom:6,padding:"6px 10px",background:C.surfaceAlt,borderRadius:8}}>💬 {o.remarks}</div>}
              <div style={{borderTop:`1px solid ${C.borderL}`,borderBottom:`1px solid ${C.borderL}`,padding:"5px 0",marginBottom:8}}>
                {o.items.map((item,i) => (
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:13}}>
                    <span style={{color:C.text}}>{item.qty}× {item.name}{item.details ? <span style={{color:C.muted}}> ({item.details})</span> : ""}</span>
                    <span style={{fontWeight:600}}>{fmt(item.totalPrice * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <select style={{padding:"6px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontFamily:F.body,background:C.surface}} value={o.status}
                  onChange={async (e) => {
                    const previousStatus = o.status;
                    const newStatus = e.target.value;
                    setOrders(prev => prev.map(x => x.id===o.id ? {...x, status: newStatus} : x));
                    try {
                      const { order } = await ordersApi.update(o.id, { status: newStatus });
                      setOrders(prev => prev.map(x => x.id===o.id ? normalizeOrder(order) : x));
                    }
                    catch (err) {
                      console.warn("Status update failed:", err);
                      setOrders(prev => prev.map(x => x.id===o.id ? {...x, status: previousStatus} : x));
                      showToast?.("Erreur : " + (err.message || "mise à jour impossible"));
                    }
                  }}>
                  <option value="pending">⏳ En attente</option><option value="preparing">👨‍🍳 Préparation</option>
                  <option value="ready">✅ Prêt</option><option value="done">📦 Terminé</option>
                </select>
                <span style={{fontSize:20,fontWeight:800,color:C.accent,fontFamily:F.display}}>{fmt(o.total)}</span>
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADMIN PRODUCTS + EDITOR (compact)
   ═══════════════════════════════════════════════════════════ */
function AdminProducts({ products, setProducts, onEdit, showToast }) {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <h2 style={{fontFamily:F.display,fontSize:22,fontWeight:700}}>Produits ({products.length})</h2>
        <div style={{display:"flex",gap:8}}>
          <button style={S.btnP} onClick={() => onEdit({id:uid(),type:"unit",name:"",price:0,description:"",photo:"📦",stock:0,category:""})}><I d={IC.plus} s={15}/> Unitaire</button>
          <button style={S.btnS} onClick={() => onEdit({id:uid(),type:"composable",name:"",description:"",photo:"🍽️",category:"",basePrice:0,options:[{groupName:"Option 1",type:"single",required:true,choices:[{id:uid(),name:"",priceDelta:0,stock:10}]}]})}><I d={IC.plus} s={15}/> Composable</button>
        </div>
      </div>
      <div className="grid-admin" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
        {products.map((p,idx) => (
          <div key={p.id} style={{...S.card,animation:`fadeUp .3s ease ${idx*40}ms both`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:32}}>{p.photo}</span>
              <span style={{...S.pill,background:p.type==="unit"?C.successL:C.accentL,color:p.type==="unit"?C.success:C.accent}}>{p.type==="unit"?"Unitaire":"Composable"}</span>
            </div>
            <h3 style={{fontSize:15,fontWeight:700,color:C.text}}>{p.name || "Sans nom"}</h3>
            <p style={{fontSize:12,color:C.muted,margin:"2px 0 10px",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.description}</p>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:16,fontWeight:700,color:C.accent}}>{p.type==="unit"?fmt(p.price):`Dès ${fmt(p.basePrice)}`}</span>
              {p.type==="unit" && <span style={{fontSize:13,fontWeight:600,color:p.stock>10?C.success:p.stock>0?"#92400e":C.danger}}>{p.stock} en stock</span>}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button style={S.btnSm} onClick={() => onEdit({...p})}><I d={IC.edit} s={13}/> Modifier</button>
              {p.type==="unit" && <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:"auto"}}>
                <button style={S.iconBtn} onClick={async () => {
                  const newStock = Math.max(0, p.stock - 1);
                  setProducts(prev => prev.map(x => x.id===p.id ? {...x, stock: newStock} : x));
                  try { await productsApi.update(p.id, { stock: newStock }); }
                  catch { showToast("Erreur stock"); }
                }}><I d={IC.minus} s={13}/></button>
                <span style={{fontSize:14,fontWeight:700,minWidth:24,textAlign:"center"}}>{p.stock}</span>
                <button style={S.iconBtn} onClick={async () => {
                  const newStock = p.stock + 1;
                  setProducts(prev => prev.map(x => x.id===p.id ? {...x, stock: newStock} : x));
                  try { await productsApi.update(p.id, { stock: newStock }); }
                  catch { showToast("Erreur stock"); }
                }}><I d={IC.plus} s={13}/></button>
              </div>}
              <button style={{...S.iconBtn,borderColor:"#fecaca",background:C.dangerL}} onClick={async () => {
                try {
                  await productsApi.remove(p.id);
                  setProducts(prev => prev.filter(x => x.id!==p.id));
                  showToast("Supprimé");
                } catch (e) { showToast("Erreur : " + e.message); }
              }}><I d={IC.trash} s={13} c={C.danger}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductEditor({ product, onSave, onCancel }) {
  const [p,setP] = useState(product);
  const emojis = ["🥖","🥐","🍫","🥗","🥬","🍕","🍔","🌮","🍣","🧁","☕","🥤","🍰","📦","🎁","👕","💐","🧴"];
  const up = (k,v) => setP(prev => ({...prev,[k]:v}));
  const addG = () => up("options",[...(p.options||[]),{groupName:`Option ${(p.options?.length||0)+1}`,type:"single",required:true,choices:[{id:uid(),name:"",priceDelta:0,stock:10}]}]);
  const upG = (gi,k,v) => { const o=[...p.options]; o[gi]={...o[gi],[k]:v}; up("options",o); };
  const rmG = gi => up("options",p.options.filter((_,i)=>i!==gi));
  const addC = gi => { const o=[...p.options]; o[gi]={...o[gi],choices:[...o[gi].choices,{id:uid(),name:"",priceDelta:0,stock:10}]}; up("options",o); };
  const upC = (gi,ci,k,v) => { const o=[...p.options]; const ch=[...o[gi].choices]; ch[ci]={...ch[ci],[k]:v}; o[gi]={...o[gi],choices:ch}; up("options",o); };
  const rmC = (gi,ci) => { const o=[...p.options]; o[gi]={...o[gi],choices:o[gi].choices.filter((_,i)=>i!==ci)}; up("options",o); };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <h2 style={{fontFamily:F.display,fontSize:20,fontWeight:700}}>{product.name?"Modifier: "+product.name:"Nouveau produit"}</h2>
        <div style={{display:"flex",gap:8}}><button style={S.btnS} onClick={onCancel}>Annuler</button><button style={S.btnP} onClick={() => onSave(p)}><I d={IC.check} s={15}/> Sauvegarder</button></div>
      </div>
      <div className="grid-editor" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={S.card}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>Informations</h3>
          <label style={S.lbl}>Icône<div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>{emojis.map(e => <button key={e} style={{width:36,height:36,borderRadius:10,border:`1px solid ${C.border}`,fontSize:16,background:p.photo===e?C.accentL:C.surface,...(p.photo===e?{outline:`2px solid ${C.accent}`}:{})}} onClick={() => up("photo",e)}>{e}</button>)}</div></label>
          <label style={S.lbl}>Nom<input style={S.inp} value={p.name} onChange={e => up("name",e.target.value)} placeholder="Ex: Pain Tradition"/></label>
          <label style={S.lbl}>Description<textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={p.description} onChange={e => up("description",e.target.value)}/></label>
          <label style={S.lbl}>Catégorie<input style={S.inp} value={p.category} onChange={e => up("category",e.target.value)}/></label>
        </div>
        <div style={S.card}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>Prix & Stock</h3>
          {p.type==="unit" ? <>
            <label style={S.lbl}>Prix (€)<input style={S.inp} type="number" step="0.01" min="0" value={p.price} onChange={e => up("price",parseFloat(e.target.value)||0)}/></label>
            <label style={S.lbl}>Stock<input style={S.inp} type="number" min="0" value={p.stock} onChange={e => up("stock",parseInt(e.target.value)||0)}/></label>
          </> : <>
            <label style={S.lbl}>Prix de base (€)<input style={S.inp} type="number" step="0.01" min="0" value={p.basePrice} onChange={e => up("basePrice",parseFloat(e.target.value)||0)}/></label>
            <div style={{marginTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:13,fontWeight:600}}>Options</span><button style={S.btnSm} onClick={addG}><I d={IC.plus} s={12}/> Groupe</button></div>
              {(p.options||[]).map((g,gi) => (
                <div key={gi} style={{background:C.surfaceAlt,border:`1px solid ${C.borderL}`,borderRadius:12,padding:10,marginBottom:8}}>
                  <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:5}}>
                    <input style={{...S.inp,flex:1,fontWeight:600,fontSize:13}} value={g.groupName} onChange={e => upG(gi,"groupName",e.target.value)}/>
                    <select style={{padding:"5px 8px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:11,fontFamily:F.body,background:C.surface}} value={g.type} onChange={e => upG(gi,"type",e.target.value)}><option value="single">1 choix</option><option value="multi">Multi</option></select>
                    {g.type==="multi" && <input style={{...S.inp,width:50,fontSize:12}} type="number" min="1" placeholder="Max" value={g.maxSelect||""} onChange={e => upG(gi,"maxSelect",parseInt(e.target.value)||undefined)}/>}
                    <label style={{fontSize:10,display:"flex",alignItems:"center",gap:2}}><input type="checkbox" checked={g.required} onChange={e => upG(gi,"required",e.target.checked)}/> Requis</label>
                    <button style={S.iconBtn} onClick={() => rmG(gi)}><I d={IC.trash} s={12} c={C.danger}/></button>
                  </div>
                  {g.choices.map((c,ci) => (
                    <div key={c.id} style={{display:"flex",gap:4,alignItems:"center",marginBottom:3}}>
                      <input style={{...S.inp,flex:1,fontSize:12}} value={c.name} placeholder="Nom" onChange={e => upC(gi,ci,"name",e.target.value)}/>
                      <input style={{...S.inp,width:60,fontSize:12}} type="number" step="0.01" placeholder="+€" value={c.priceDelta} onChange={e => upC(gi,ci,"priceDelta",parseFloat(e.target.value)||0)}/>
                      <input style={{...S.inp,width:50,fontSize:12}} type="number" placeholder="Stock" value={c.stock} onChange={e => upC(gi,ci,"stock",parseInt(e.target.value)||0)}/>
                      <button style={{...S.iconBtn,width:26,height:26}} onClick={() => rmC(gi,ci)}><I d={IC.x} s={11}/></button>
                    </div>
                  ))}
                  <button style={{...S.btnSm,marginTop:2,fontSize:11}} onClick={() => addC(gi)}><I d={IC.plus} s={10}/> Choix</button>
                </div>
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANALYTICS
   ═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   LOYALTY PANEL (Admin — Point 1)
   ═══════════════════════════════════════════════════════════ */
function LoyaltyPanel({ orders, shop }) {
  const byPhone = {};
  orders.forEach(o => {
    if (!o.customerPhone) return;
    if (!byPhone[o.customerPhone]) byPhone[o.customerPhone] = { phone: o.customerPhone, name: o.customerName, count: 0, total: 0 };
    byPhone[o.customerPhone].count++;
    byPhone[o.customerPhone].total += o.total;
  });
  const clients = Object.values(byPhone).sort((a,b) => b.count - a.count);
  const target = shop.loyaltyTarget || 6;
  const eligible = clients.filter(c => c.count >= target);

  return (
    <div>
      <h2 style={{fontFamily:F.display,fontSize:22,fontWeight:700,marginBottom:8}}>Programme fidélité</h2>
      <p style={{color:C.muted,fontSize:14,marginBottom:20}}>Objectif : <strong>{target} commandes</strong> → <strong>{shop.loyaltyReward || "récompense"}</strong></p>

      <div className="grid-stats" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12,marginBottom:24}}>
        {[{label:"Clients uniques",value:clients.length,icon:"👤"},{label:"Clients fidèles (2+)",value:clients.filter(c=>c.count>=2).length,icon:"⭐"},{label:"Éligibles récompense",value:eligible.length,icon:"🎁"}].map((m,i) => (
          <div key={i} style={{...S.card,textAlign:"center",padding:"18px 14px"}}>
            <div style={{fontSize:24,marginBottom:4}}>{m.icon}</div>
            <div style={{fontSize:22,fontWeight:800,color:C.accent}}>{m.value}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:12}}>Clients et progression</h3>
        {clients.length === 0 ? <p style={{color:C.muted,fontSize:14}}>Aucun client avec numéro de téléphone.</p>
        : <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {clients.slice(0,20).map((c,i) => {
            const pct = Math.min(100, Math.round(c.count / target * 100));
            const isEligible = c.count >= target;
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:isEligible?"#fef3c7":C.surfaceAlt,borderRadius:10,border:`1px solid ${isEligible?"#fde68a":C.borderL}`}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{c.name || "Anonyme"} <span style={{color:C.muted,fontWeight:400,fontSize:12}}>{c.phone}</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                    <div style={{flex:1,height:5,background:C.borderL,borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:isEligible?C.waGreen:C.accent,borderRadius:4,transition:"width .5s ease"}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:600,color:isEligible?C.success:C.muted}}>{c.count}/{target}</span>
                  </div>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:C.accent}}>{fmt(c.total)}</span>
                {isEligible && <span style={{...S.pill,background:C.successL,color:C.success,fontSize:10}}>🎁 Éligible</span>}
              </div>
            );
          })}
        </div>}
      </div>

      <div style={{marginTop:16,...S.card}}>
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>Offres automatiques proposées par l'IA</h3>
        <p style={{fontSize:13,color:C.textSoft,lineHeight:1.5,marginBottom:10}}>Basé sur le comportement client, le système peut proposer :</p>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[
            {icon:"🎁",text:"Client atteint le seuil → Récompense fidélité automatique",auto:true},
            {icon:"☕",text:"Client commande 2 semaines d'affilée → Boisson offerte",auto:true},
            {icon:"💸",text:"Client absent depuis 2+ semaines → Offre -10% de retour",auto:true},
            {icon:"🍰",text:"Chaque 5e commande → Dessert offert",auto:true},
          ].map((r,i) => (
            <div key={i} style={{padding:"10px 12px",background:C.surfaceAlt,borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>{r.icon}</span>
              <span style={{flex:1,fontSize:13,color:C.text}}>{r.text}</span>
              <span style={{...S.pill,background:C.accentL,color:C.accent,fontSize:10}}>Auto</span>
            </div>
          ))}
        </div>
        <p style={{fontSize:12,color:C.muted,marginTop:10}}>💡 Chaque offre est soumise à validation du commerçant avant envoi WhatsApp au client.</p>
      </div>
    </div>
  );
}

function Analytics({ orders }) {
  const totalRev = orders.reduce((s,o) => s+o.total,0);
  const avg = orders.length ? totalRev/orders.length : 0;
  const itemCounts = {};
  orders.forEach(o => o.items.forEach(i => { itemCounts[i.name] = (itemCounts[i.name]||0) + i.qty; }));
  const best = Object.entries(itemCounts).sort((a,b) => b[1]-a[1]).slice(0,5);

  return (
    <div>
      <h2 style={{fontFamily:F.display,fontSize:22,fontWeight:700,marginBottom:16}}>Analytics</h2>
      <div className="grid-stats" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
        {[{label:"Revenu total",value:fmt(totalRev),icon:"💰"},{label:"Commandes",value:orders.length,icon:"📦"},{label:"Panier moyen",value:fmt(avg),icon:"🛒"}].map((m,i) => (
          <div key={i} style={{...S.card,textAlign:"center",padding:"20px 14px"}}>
            <div style={{fontSize:28,marginBottom:4}}>{m.icon}</div>
            <div style={{fontSize:22,fontWeight:800,color:C.accent}}>{m.value}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>{m.label}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:12}}>🏆 Best-sellers</h3>
        {best.length === 0 ? <p style={{color:C.muted}}>Pas encore de données</p>
        : best.map(([name,count],i) => {
          const max = best[0][1];
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
              <span style={{width:20,fontWeight:700,color:i===0?C.accent:C.muted,fontSize:14}}>{i+1}.</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:14,fontWeight:600}}>{name}</span>
                  <span style={{fontSize:13,fontWeight:700,color:C.accent}}>{count}</span>
                </div>
                <div style={{height:5,background:C.surfaceAlt,borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(count/max)*100}%`,background:`linear-gradient(90deg,${C.accent},${C.accentH})`,borderRadius:4}}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   QR PANEL
   ═══════════════════════════════════════════════════════════ */
function QRPanel({ shop, restaurants }) {
  const rests = restaurants || [{id:"main",name:shop.name,address:shop.address,open:true}];
  return (
    <div>
      <h2 style={{fontFamily:F.display,fontSize:22,fontWeight:700,marginBottom:8}}>QR Codes par établissement</h2>
      <p style={{color:C.muted,fontSize:14,marginBottom:16}}>Chaque restaurant a son propre QR code qui redirige vers son menu.</p>
      <div className="grid-rests" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14,marginBottom:16}}>
        {rests.map(r => {
          const url = `https://pockly.be/${r.id}/${r.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
          return (
            <div key={r.id} style={{...S.card,textAlign:"center",padding:20}}>
              <QRCode value={url} size={150}/>
              <h3 style={{fontSize:14,fontWeight:700,marginTop:10,color:C.text}}>{r.name}</h3>
              <p style={{fontSize:11,color:C.muted,margin:"4px 0"}}>{r.address}</p>
              <p style={{fontFamily:F.mono,fontSize:10,color:C.muted,wordBreak:"break-all"}}>{url}</p>
              <span style={{...S.pill,marginTop:6,display:"inline-block",background:r.open?C.successL:C.dangerL,color:r.open?C.success:C.danger}}>{r.open?"Ouvert":"Fermé"}</span>
            </div>
          );
        })}
      </div>
      <div style={{...S.card}}>
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:10}}>Où utiliser vos QR codes ?</h3>
        {["🏪 En vitrine — Les passants scannent et commandent sans entrer","📦 Sur vos emballages — Le client recommande en 1 scan","📱 Réseaux sociaux — Lien direct vers le menu du restaurant","🍽️ Sur les tables — Commande depuis la place, zéro attente"].map((t,i) => (
          <p key={i} style={{fontSize:13,color:C.textSoft,lineHeight:1.6,margin:"6px 0"}}>{t}</p>
        ))}
        <div style={{marginTop:12,padding:12,background:C.accentXL,borderRadius:10,border:`1px solid ${C.accentL}`}}>
          <p style={{fontSize:13,color:C.accent,margin:0,lineHeight:1.5}}>💡 Scan → catalogue du restaurant → commande en 3 taps → ouverture possible du suivi WhatsApp. <strong>Zéro app, zéro compte.</strong></p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHOP SETTINGS
   ═══════════════════════════════════════════════════════════ */
function ShopSettings({ shop, setShop, restaurants, setRestaurants, adminUser, setAdminUser }) {
  const myRestaurant = restaurants?.find(r => r.id === adminUser?.restaurantId) || null;
  const loyaltyTarget = myRestaurant?.loyaltyTarget ?? shop.loyaltyTarget ?? 6;
  const loyaltyReward = myRestaurant?.loyaltyReward ?? shop.loyaltyReward ?? "";
  // Optimistic local update + debounced API call
  const restPatchTimer = useRef(null);
  const restPatchPending = useRef({});
  const updateMyRestaurant = (patch) => {
    if (!myRestaurant) return;
    setRestaurants(prev => prev.map(r => r.id === myRestaurant.id ? { ...r, ...patch } : r));
    // Accumulate patches and flush after 500ms of inactivity
    Object.assign(restPatchPending.current, patch);
    if (restPatchTimer.current) clearTimeout(restPatchTimer.current);
    restPatchTimer.current = setTimeout(async () => {
      const toSend = restPatchPending.current;
      restPatchPending.current = {};
      try {
        const { restaurant } = await restaurantsApi.update(myRestaurant.id, toSend);
        setRestaurants(prev => upsertRestaurantList(prev, normalizeRestaurant(restaurant)));
      } catch (e) {
        console.warn("Restaurant update failed:", e.message);
      }
    }, 500);
  };
  const updateLoyaltySettings = (patch) => {
    if (myRestaurant) {
      updateMyRestaurant(patch);
      return;
    }
    setShop((prev) => ({ ...prev, ...patch }));
  };
  return (
    <div>
      <h2 style={{fontFamily:F.display,fontSize:22,fontWeight:700,marginBottom:16}}>Configuration</h2>

      {myRestaurant && (
        <div style={{...S.card,marginBottom:20,borderLeft:`4px solid ${C.accent}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:14}}>
            <h3 style={{fontSize:15,fontWeight:700,display:"flex",alignItems:"center",gap:6,margin:0}}>
              <span>🏪</span> Mon établissement
              <span style={{...S.pill,fontSize:10,background:myRestaurant.open?C.successL:C.dangerL,color:myRestaurant.open?C.success:C.danger}}>{myRestaurant.open?"Ouvert":"Fermé"}</span>
            </h3>
            <button style={S.btnSm} onClick={() => updateMyRestaurant({ open: !myRestaurant.open })}>
              {myRestaurant.open ? "Fermer temporairement" : "Rouvrir"}
            </button>
          </div>
          <div className="grid-editor" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <label style={S.lbl}>Nom de l'établissement
              <input style={S.inp} value={myRestaurant.name} onChange={e => updateMyRestaurant({ name: e.target.value })}/>
            </label>
            <label style={S.lbl}>Téléphone du commerce
              <input style={S.inp} value={myRestaurant.phone} onChange={e => updateMyRestaurant({ phone: e.target.value })}/>
            </label>
            <label style={S.lbl}>Adresse complète
              <input style={S.inp} value={myRestaurant.address} onChange={e => updateMyRestaurant({ address: e.target.value })}/>
            </label>
            <label style={S.lbl}>Temps de préparation (min)
              <input style={S.inp} type="number" min="1" max="120" value={myRestaurant.prepTime} onChange={e => updateMyRestaurant({ prepTime: parseInt(e.target.value) || 15 })}/>
            </label>
          </div>
          <p style={{fontSize:11,color:C.muted,marginTop:8,fontFamily:"monospace"}}>ID: {myRestaurant.id}</p>
        </div>
      )}

      {!myRestaurant && adminUser && (
        <div style={{...S.card,marginBottom:20,background:"#fef3c7",borderLeft:`4px solid #f59e0b`}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:6}}>⚠️ Aucun établissement lié</h3>
          <p style={{fontSize:13,color:C.textSoft,marginBottom:10}}>Votre compte n'est pas encore associé à un établissement. Créez-en un pour que vos clients puissent commander.</p>
          <button style={S.btnP} onClick={async () => {
            try {
              const { restaurant, token } = await restaurantsApi.create({
                name: shop.name || "Mon commerce",
                address: shop.address || "Adresse à renseigner",
                phone: shop.phone || "+32000000000",
                prepTime: shop.prepTime || 15,
              });
              if (token) auth.setToken(token);
              const norm = normalizeRestaurant(restaurant);
              setRestaurants(prev => upsertRestaurantList(prev, norm));
              setAdminUser({ ...adminUser, restaurantId: norm.id });
            } catch (e) {
              alert("Erreur : " + e.message);
            }
          }}>Créer mon établissement maintenant</button>
        </div>
      )}

      <div className="grid-editor" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={S.card}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>Préférences générales</h3>
          <p style={{fontSize:12,color:C.muted,marginBottom:14,lineHeight:1.5}}>Réglages globaux qui s'appliquent à votre programme de fidélité.</p>
          <label style={S.lbl}>Fidélité — seuil (nb commandes)<input style={S.inp} type="number" min="2" value={loyaltyTarget} onChange={e => updateLoyaltySettings({ loyaltyTarget: parseInt(e.target.value) || 6 })}/></label>
          <label style={S.lbl}>Récompense fidélité<input style={S.inp} value={loyaltyReward} onChange={e => updateLoyaltySettings({ loyaltyReward: e.target.value })} placeholder="Ex: 1 croissant offert"/></label>
          {!myRestaurant && <>
            <label style={S.lbl}>Nom du shop (legacy)<input style={S.inp} value={shop.name} onChange={e => setShop(s => ({...s,name:e.target.value}))}/></label>
            <label style={S.lbl}>Adresse<input style={S.inp} value={shop.address} onChange={e => setShop(s => ({...s,address:e.target.value}))}/></label>
            <label style={S.lbl}>Téléphone<input style={S.inp} value={shop.phone} onChange={e => setShop(s => ({...s,phone:e.target.value}))}/></label>
            <label style={S.lbl}>Temps de préparation (min)<input style={S.inp} type="number" min="1" value={shop.prepTime||15} onChange={e => setShop(s => ({...s,prepTime:parseInt(e.target.value)||15}))}/></label>
          </>}
        </div>
        <div style={S.card}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
            <I d={IC.wa} s={18} c={C.waGreen} f={C.waGreen}/> WhatsApp Business API
          </h3>
          <div style={{padding:14,background:C.surfaceAlt,borderRadius:12,border:`1px solid ${C.borderL}`,marginTop:8}}>
            <h4 style={{fontSize:13,fontWeight:700,color:C.text,margin:"0 0 8px"}}>À savoir avant l'intégration</h4>
            <p style={{fontSize:12,color:C.textSoft,lineHeight:1.7,margin:"0 0 8px"}}>
              Les secrets Meta ne doivent pas être saisis dans le navigateur. Cette version full stack prépare l'UX, mais la connexion WhatsApp Business doit être branchée côté serveur avec des variables d'environnement sécurisées.
            </p>
            <ol style={{fontSize:12,color:C.textSoft,lineHeight:1.9,paddingLeft:16,margin:0}}>
              <li>Créer une app <strong>Meta Business</strong> avec le produit WhatsApp</li>
              <li>Garder <strong>Phone Number ID</strong> et <strong>Access Token</strong> côté backend</li>
              <li>Configurer un webhook public pour recevoir les statuts</li>
              <li>Envoyer les confirmations et changements de statut depuis l'API serveur</li>
            </ol>
          </div>
          <div style={{marginTop:12,padding:12,background:"#f0fdf4",borderRadius:10,border:"1px solid #bbf7d0"}}>
            <h4 style={{fontSize:13,fontWeight:700,color:"#166534",margin:"0 0 6px"}}>Messages envoyés automatiquement :</h4>
            <div style={{fontSize:12,color:"#15803d",lineHeight:1.7}}>
              ✅ Commande reçue — immédiat<br/>
              👨‍🍳 En préparation — au changement de statut<br/>
              🎉 Commande prête — au changement de statut<br/>
              ❌ Annulation — si annulée par le restaurant
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════ */
const S = {
  header: {display:"flex",alignItems:"center",gap:10,padding:"12px 20px",background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10},
  nav: {display:"flex",gap:2,padding:"5px 20px",background:C.surface,borderBottom:`1px solid ${C.border}`,overflowX:"auto"},
  navBtn: {display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:10,fontSize:13,fontWeight:500,color:C.muted,background:"transparent",transition:"all .15s",whiteSpace:"nowrap"},
  navA: {background:C.accentL,color:C.accent,fontWeight:700},
  navBadge: {minWidth:18,height:18,borderRadius:9,background:C.accent,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px"},
  main: {padding:20,maxWidth:1100,margin:"0 auto"},
  clientH: {display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10},
  card: {background:C.surface,border:`1px solid ${C.borderL}`,borderRadius:16,padding:18},
  cCard: {background:C.surface,border:`1px solid ${C.borderL}`,borderRadius:14,overflow:"hidden",textAlign:"left",display:"flex",flexDirection:"column",fontFamily:F.body},
  btnP: {display:"inline-flex",alignItems:"center",gap:6,padding:"10px 20px",background:`linear-gradient(135deg,${C.accent},${C.accentH})`,color:"#fff",borderRadius:12,fontSize:13,fontWeight:600,transition:"all .2s",boxShadow:`0 2px 8px ${C.glow}`},
  btnS: {display:"inline-flex",alignItems:"center",gap:6,padding:"10px 20px",background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:12,fontSize:13,fontWeight:600},
  btnSm: {display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,fontWeight:500,color:C.text},
  iconBtn: {display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,border:`1px solid ${C.border}`,borderRadius:8,background:C.surface},
  ghostBtn: {display:"flex",alignItems:"center",justifyContent:"center",width:34,height:34,background:"transparent",borderRadius:8,color:C.text},
  qtyBtn: {width:40,height:40,borderRadius:"50%",border:`2px solid ${C.border}`,background:C.surface,fontSize:20,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.body,color:C.text},
  cartBadge: {position:"absolute",top:1,right:1,width:18,height:18,borderRadius:"50%",background:C.accent,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"},
  inp: {width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,fontFamily:F.body,boxSizing:"border-box",background:C.surface,transition:"border .15s",color:C.text},
  lbl: {display:"block",fontSize:13,fontWeight:600,color:C.text,marginBottom:12,lineHeight:2},
  pill: {fontSize:11,padding:"3px 9px",borderRadius:20,fontWeight:600,background:C.successL,color:C.success},
  authLbl: {display:"block",fontSize:13,fontWeight:600,color:C.text,marginBottom:14},
  overlay: {position:"fixed",inset:0,background:"rgba(24,18,43,.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20},
  modal: {background:C.surface,borderRadius:24,padding:"32px 28px",textAlign:"center",maxWidth:360,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,.15)",border:`1px solid ${C.borderL}`},
  toast: {position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.dark,color:"#fff",padding:"10px 22px",borderRadius:12,fontSize:14,fontWeight:500,zIndex:1000,fontFamily:F.body,boxShadow:"0 8px 24px rgba(0,0,0,.2)",animation:"fadeUp .3s ease"},
  modeCard: {background:C.surface,border:`1px solid ${C.borderL}`,borderRadius:20,padding:"32px 28px",width:220,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all .25s",boxShadow:"0 4px 16px rgba(0,0,0,.05)",fontFamily:F.body},
  choiceBtn: {padding:"12px 14px",borderRadius:12,border:`2px solid ${C.border}`,background:C.surface,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",transition:"all .15s"},
  choiceSel: {borderColor:C.accent,background:C.accentXL},
};
