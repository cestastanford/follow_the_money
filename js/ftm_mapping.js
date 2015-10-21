// menu :: stores data categories
// active_menuitem :: controls what category of data is displayed
var menu = [
  {
    id: 0,
    active_display: true,
    text: "O_C",
    description: "description description description",
    category: "O_C"
  },
  {
    id: 1,
    active_display: false,
    text: "BLM_Grz_3",
    description: "description description description",
    category: "BLM_Grz_3"
  },
  {
    id: 2,
    active_display: false,
    text: "BLM_GRZ_15",
    description: "description description description",
    category: "BLM_GRZ_15"
  },
  {
    id: 3,
    active_display: false,
    text: "Bankhead_Jones_Other",
    description: "description description description",
    category: "Bankhead_Jones_Other"
  },
  {
    id: 4,
    active_display: false,
    text: "BLM_Tmb",
    description: "description description description",
    category: "BLM_Tmb"
  },
  {
    id: 5,
    active_display: false,
    text: "BLM_FML",
    description: "description description description",
    category: "BLM_FML"
  },
  {
    id: 6,
    active_display: true,
    text: "L_CFG",
    description: "description description description",
    category: "L_CFG"
  },
  {
    id: 7,
    active_display: false,
    text: "FS_Grz",
    description: "description description description",
    category: "FS_Grz"
  },
  {
    id: 8,
    active_display: false,
    text: "FS_Tmb",
    description: "description description description",
    category: "FS_Tmb"
  },
  {
    id: 9,
    active_display: true,
    text: "PILT",
    description: "description description description",
    category: "PILT"
  },
  {
    id: 10,
    active_display: true,
    text: "SRS",
    description: "description description description",
    category: "SRS"
  },
  {
    id: 11,
    active_display: false,
    text: "FS_Grz raw",
    description: "description description description",
    category: "FS_Grz raw"
  },
  {
    id: 12,
    active_display: false,
    text: "FS_Tmb_raw_rnd_to_1000",
    description: "description description description",
    category: "FS_Tmb_raw_rnd_to_1000"
  },
  {
    id: 13,
    active_display: false,
    text: "FS_Acreage",
    description: "description description description",
    category: "FS_Acreage"
  },
  {
    id: 14,
    active_display: false,
    text: "Jurisdictional_Acreage",
    description: "description description description",
    category: "Jurisdictional_Acreage"
  },
  {
    id: 15,
    active_display: false,
    text: "Federal_Acreage",
    description: "description description description",
    category: "Federal_Acreage"
  },
  {
    id: 16,
    active_display: false,
    text: "BLM_Acreage",
    description: "description description description",
    category: "BLM_Acreage"
  }
];
var active_menuitem = 6;

// timeline :: stores map by year data
// current_year :: controls both the map displayed and what year's data is used
var timeline = [
  {
    id: 1970,
    map: "county_maps/US_county_1970_west.topo.json",
    data: "county_data/data_1970s.tsv",
    obj: "US_county_1970_west"
  },
  {
    id: 1980,
    map: "county_maps/US_county_1980_west.topo.json",
    data: "county_data/data_1970s.tsv",
    obj: "US_county_1980_west"
  }
];
var current_year = 1970;

// min_year & max_year
//  :: control scale of timeline and range of data
//  :: also used for calculations
var min_year = 1970;
var max_year = 1979;
var to_print = Math.floor((current_year-min_year)/10);
console.log(to_print);
//
var width = 660;
var height = 600;
var side_width = 300;
var side_height = 200;
var padding = 50;
var rateById = d3.map();

var quantize = d3.scale.quantize()
  .domain([0, 100000])
  .range(d3.range(9).map(function(i) {
    return "q" + i + "-9";
  }));


// Main Display - SVG SetUp
var mainDisplaySVG = d3.selectAll(".mainDiv").append("svg")
  .attr("class", "mainDisplaySVG")
  .attr("width", width)
  .attr("height", height);

// Side Display - SVG SetUp
var sideDisplaySVG = d3.selectAll(".sideDisplayDiv").append("svg")
  .attr("class", "sideDisplaySVG")
  .attr("width", side_width)
  .attr("height", side_height);

//Queue Data
queueData();

// Set Up Main Menu
d3.select(".sideMenuDiv").selectAll("div")
  .data(menu)
  .enter()
  .append("div")
  .text(function(m){
    return m.text;
  })
  .attr("type", "button")
  .attr("class", function(d) {
      if(d.active_display == true){
        return "menuitem btn btn-default btn-block " + d.category;
      }else{
        return "menuitem btn btn-default btn-block hide " + d.category;
      }
    })
  .on("click", function(d){
    // console.log(d);
    // adjustSideDisplay(d);
    active_menuitem = d.id;
    d3.selectAll(".btn-primary").classed('btn-primary', false).classed('btn-default', true);
    d3.select(this).classed('btn-primary', true).classed('btn-default', false);
    queueData();
  });


d3.select(".mainDiv")
  .append("div")
  .attr("class", "timeController");

// Set Up Time Controller
d3.select(".timeController")
  .append("div")
  .text("Previous Year")
  .attr("id", "prevYear")
  .attr("class", "btn btn-primary btn-block")
  .on("click", function(d){
    if(current_year != min_year){
      current_year = current_year - 1;
      queueData();
    }
  });

d3.select(".timeController")
  .append("div")
  .attr("id", "year")
  .attr("class", "center btn-block")
  .text(current_year);

d3.select(".timeController")
  .append("div")
  .text("Next Year")
  .attr("id", "nextYear")
  .attr("class", "btn btn-primary btn-block")
  .on("click", function(d){
    if(current_year != max_year){
      current_year = current_year + 1;
      queueData();
    }
  });

d3.select("." + menu[active_menuitem].category).classed('btn-primary', true).classed('btn-default', false);

function queueMap() {
  .defer(d3.json, timeline[(Math.floor((current_year-min_year)/10))].map)
  var projection = d3.geo.projection(function(x, y) { return [x, y];})
        .precision(0).scale(1).translate([0, 0]);
  //d3.geo.albersUsa().scale(width).translate([width / 2, height / 2]);
  // d3.geo.mercator();
  //     .scale(550)
  //     .translate([((width+250) / 2), (height+150) / 2]);
  //     .translate([0, 0])
  //     .scale(width / 2 / Math.PI);
var path = d3.geo.path()
    .projection(projection);

    // TRY
    var bounds = path.bounds(json),
    scale  = .95 / Math.max((bounds[1][0] - bounds[0][0]) / width,
            (bounds[1][1] - bounds[0][1]) / height),
    transl = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2,
            (height - scale * (bounds[1][1] + bounds[0][1])) / 2];

    projection.scale(scale).translate(transl);
  }
}

function queueData() {
  quantize = quantize
    .domain([0, 100000])
    .range(d3.range(9).map(function(i) {
      return "q" + i + "-9";
    }));
  queue()
    // .defer(d3.json, timeline[(Math.floor((current_year-min_year)/10))].map)
    .defer(d3.tsv, timeline[(Math.floor((current_year-min_year)/10))].data, function(d) {
          var active_id = current_year + '_ST_CNTY';
          console.log(active_id);
          rateById.set(d[active_id], d);
        })
    .await(updateMap);
}

function updateMap(error, us) {
  if(error) return console.error(error);

  // Remove all existing things from main display
  d3.selectAll(".mainDisplaySVG > *").remove();
  updateYear();

  mainDisplaySVG.append("g")
      .attr("class", "counties")
    .selectAll("path")
      .data(topojson.feature(us, us.objects[timeline[(Math.floor((current_year-min_year)/10))].obj]).features)
    .enter().append("path")
      .attr("class", function(d) {
        if(rateById.get(d.id)) {
          var active_data = current_year + "_" + menu[active_menuitem].category;
          var data = rateById.get(d.id);
          return quantize(data[active_data]) + " cpath";
        } else
          return "q-1 cpath";
        })
      .on("click", function(d){
        // console.log(d);
        adjustSideDisplay(d);
        d3.selectAll("path.selected").classed('selected', false);
        d3.select(this).classed('selected', true);
      })
      .attr("d", path);
}

function updateYear(){
  d3.select("#year")
    .text(current_year);

  // Adjust Previous Year Button
  if(current_year == min_year){
    d3.select("#prevYear")
      .attr("class", "btn btn-default btn-block");
  }else{
    d3.select("#prevYear")
      .attr("class", "btn btn-primary btn-block");
  }

  //Adjust Next Year Button
  if(current_year == max_year){
    d3.select("#nextYear")
      .attr("class", "btn btn-default btn-block");
  }else{
    d3.select("#nextYear")
      .attr("class", "btn btn-primary btn-block");
  }
}

function adjustSideDisplay(d){
  var data = rateById.get(d.id);
  var dataset = [];

  d3.selectAll("#side_title")
    .text(d.id);


  for (i = min_year; i <= max_year; i++) {
    var active_data = i + "_" + menu[active_menuitem].category;
    if(data[active_data]){
      var next = [[i, +data[active_data]]];
      dataset = dataset.concat(next);
    }
  }

  // console.log("dataset: " + dataset);

  var xScale = d3.scale.linear()
     .domain([d3.min(dataset, function(d) { return d[0]; }), d3.max(dataset, function(d) { return d[0]; })])
     .range([padding, side_width - padding]);

  var yScale = d3.scale.linear()
     .domain([0, d3.max(dataset, function(d) { return d[1]; })])
     .range([side_height - padding, padding]);

  // console.log("min_x: " + d3.min(dataset, function(d) { return d[0]; }));
  // console.log("max_x: " + d3.max(dataset, function(d) { return d[0]; }));
  // console.log("min_y: " + d3.min(dataset, function(d) { return d[1]; }));
  // console.log("max_y: " + d3.max(dataset, function(d) { return d[1]; }));

  //Define X axis
  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .tickFormat(d3.format("4d"));

  //Define Y axis
  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(5)
    .tickFormat(d3.format("e"));

  var line = d3.svg.line()
    .x(function(d) { return xScale(d[0])})
    .y(function(d) { return yScale(d[1])});

  // Remove everything from side display
  d3.selectAll(".sideDisplaySVG > *").remove();

  // Add relevant points
  sideDisplaySVG.selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("cx", function(d) {
      // console.log("x: " + d[0]);
      // console.log("cx: " + xScale(d[0]));
      return xScale(d[0]);
    })
    .attr("cy", function(d) {
      // console.log("y: " + d[1]);
      // console.log("cy: " + yScale(d[1]));
      return yScale(d[1]);
    })
    .attr("r", 2)
    .attr("fill", "black");

  // Create X axis
  sideDisplaySVG.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + (side_height - padding) + ")")
    .call(xAxis);

  // Create Y axis
  sideDisplaySVG.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + (padding) + ",0)")
    .call(yAxis);

  sideDisplaySVG.append("path")
    .datum(dataset)
    .attr("class", "line")
    .attr("d", line);
    };
