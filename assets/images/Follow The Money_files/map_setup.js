/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2, white: true, maxerr: 50, todo: true */
/*global $, d3, queue, topojson, percentrank, colorbrewer, slider*/

(function () {

	/* TEST VARIABLES */
	// TODO: Delete All Test Variables
	var extra_data;

	/* :: VARIABLE DECLARATION & INSTANTIATION :: */
	var map,                    //Map Variables
			data = {},
			breaks = {},
			projection,
			tooltip,
			maptip,

			usa_background_layer,   //Map Layers
			other_countries_layer,
			usa_foreground_layer,
			other_state_layer,
			county_layer,
			highlighted_state_layer,
			county_highlight_layer,
			cities_layer,

			current_payments_map,   //Map Type Variables
			inter_county = {
				header: "Inter-County Payments",
				sub_header: "in 2014 dollars",
				break_class: "YlGn",
				num_cats: 5
			},
			intra_county = {
				header: "Intra-County Payments",
				sub_header: "Each county\'s payment compared to its historical average",
				break_class: "RdBl",
				num_cats: 6,
				break_labels: ["Minimum Received", "", "",
												"Average Received", "", "",
												"Maximum Received"]
			},

			current_year,           //Time Control Variables
			min_year,
			max_year,
			timeslider,

			linechart_svg,          //Line Chart Variables
			chartlabel,
			charttips = [],
			county_line_colour = "#F38347",
			background_colour = "#F4F2EE",
			average_colour = "#636260",

			current_category,       //Category Variables
			num_categories,

			menutip;
	var centerbar_width = 653 - 35,
			prog_descr_width = 243,
			chart_height = 180,
			graph_padding = 50;
	// Declare Data Maps
	var rateById = d3.map(),
			manualBreaksById = d3.map(),
			averagesByYear = [];
	// Store Filenames
	var all_data_src = "data/Master_simple.csv",
			all_avg_src = "data/us_medians_by_year.csv",
			all_county_breaks_src = "data/inter_county_class_breaks.csv",
			us_averages_src = "data/us_medians_by_year.csv",
			intra_county_breaks_src = "_intra_county_class_breaks.csv",
			menuitem_src = "data/menu.json",
			all_cities_src = "topojson_files/cities/cities_wgs84_topo.json";
	// Menu Item Initialization
	var program_menu = d3.map(),
			excluded_headers = ['STATE', 'COUNTY', 'YEAR', 'ST_CNTY', 'LAT', 'LON'],
			state_names = ['Arizona', 'California', 'Colorado', 'Idaho', 'Montana', 'New Mexico', 'Nevada', 'Oregon', 'Utah', 'Washington', 'Wyoming'];
	// Format
	var formatCurrency = d3.format("$,f"),
			formatPercent = d3.format(".0%");

	/* :: HELPER FUNCTIONS :: */
	function arrIsNull(arr) {
			'use strict';
			var joined_arr = arr.join().replace(/,/g, '').length;
			if (+joined_arr >= 0) {
				return false;
			}
			return true;
	}
	function find_by_id(search_obj, id) {
		'use strict';
		// return search_obj.filter(function (item, i, allItems) {
		return search_obj.filter(function (item) {
			return item.id === id;
		})[0];
	}
	function create_layer(data, obj_string, layer_label, layer_class, clickable) {
		'use strict';
		var newLayer = d3.carto.layer.featureArray();

		newLayer
			.features(topojson.feature(data, data.objects[obj_string]).features)
			.renderMode("svg");

		if (layer_label !== null) { newLayer.label(layer_label); }
		if (layer_class !== null) { newLayer.cssClass(layer_class); }
		if (clickable !== null) { newLayer.clickableFeatures(clickable); }

		return newLayer;
	}
	function get_class_break(curr_obj) {
		'use strict';
		var rate_value = curr_obj[current_category];

		if (rate_value === undefined || rate_value === "" ||
				(!rate_value && rate_value !== 0)) {
			return "dark_gray";
		} if ((+rate_value <= 0) && (current_payments_map === inter_county.header)) {
			return "light_gray";
		}

		rate_value = +rate_value;

		if (manualBreaksById.get([current_payments_map, current_category])) {
			// MANUAL BREAKS
			/* TODO: Distinguish between light gray and null for all  -- light_gray vs q0 */
			var breaks = manualBreaksById.get([current_payments_map, current_category]);
			var i, break_cat;

			if (current_payments_map === intra_county.header) {
				breaks = breaks._[curr_obj.ST_CNTY];
				num_categories = intra_county.num_cats;
			} else {
				num_categories = inter_county.num_cats;
			}

			for (i = 0; i < num_categories; i += 1) {
				if (current_payments_map === inter_county.header) {
					break_cat = (i + 1) * (100 / num_categories);
				} else {
					break_cat = (i) * (100 / (num_categories-1));
				}
				if (rate_value <= +breaks[break_cat]) {
					return "q" + i + "-" + num_categories;
				}
			}
			if (+rate_value == 0){
				return "dark_gray";
			}else{
				return "q" + (num_categories-1) + "-" + num_categories;
			}
		}

		// Else -- Manual Breaks Not Specified
		// CALCULATED BREAKS
		var rank = percentrank(data[current_category], +rate_value);
		if (rank === "#N/A" || rank === "NA") {
			console.log("out of bounds error for val: " + rate_value);
			return "dark_gray";
		}
		var class_num = Math.floor(num_categories * rank);
		return "q" + class_num + "-" + num_categories;

	}
	function get_tick_breaks(dataset) {
		'use strict';
		var max_data = +dataset['100'],
				i;
		var data_ticks = [];
		for (i = 1; i < max_data; i *= 100) {
			data_ticks.push((max_data / i).toPrecision(2));
		}
		return data_ticks;
	}
	function getNum(currentValue, index, array) {
		'use strict';
		if (!currentValue && !array) { console.log("noVal"); }
		var cx = index + min_year;
		var cy = rateById.get([d3.select('.wc_highlight.selected')[0][0].id, cx])[current_category];
		return {cx: cx, cy: cy};
	}
	function create_maptip(text) {
		$("#maptip").fadeTo(1000, 0, function(){
				$("#maptip").alert('close');
		});

		maptip = d3.select("#map").append("div")
			.attr("id", "maptip")
			.attr("class", "alert alert-info alert-dismissible fade in out")
			.attr("role","alert")
			.on("mousedown", function() {
				$("#maptip").alert('close');
			});
		var maptip_text = maptip.append("div")
			.attr("class", "tooltext")
			.text(text);
		maptip_text.append("button")
				.attr("class", "close")
				.attr("data-dismiss", "alert")
				.attr("aria-label", "close")
				.append("span")
					.attr("aria-hidden", "true")
					.html("&times;");

	}

	/* :: UPDATING FUNCTIONS :: */
	function update_counties() {
		'use strict';
		d3.selectAll("g.wc")
			.selectAll("path")
			.attr("class", function (d) {
				var new_class_def = "wc";
				var curr_obj = rateById.get([d.id, current_year]);
				if (curr_obj) {
					var class_break =
					get_class_break(curr_obj);
					new_class_def += " " + class_break;
				}
				if (this.classList.contains('selected')) {
					new_class_def += ' selected';
				}
				return new_class_def;
			});
	}
	function update_chart() {
		'use strict';

		// Remove everything from display
		d3.selectAll("#linechart_legend > *").remove();
		d3.selectAll("#linechart_svg > *").remove();

		// Set Up Chart
		var data_title = "Payment History";
		var data_label = "Select A County";
		var data_sublabel = "To View Data";

		var data_ticks = get_tick_breaks(manualBreaksById.get([inter_county.header, current_category]));
		var data_max = manualBreaksById.get([inter_county.header, current_category])['100'];

		var ticksize = 5;

		// Set Up Scales for Line Graph
		var xScale = d3.scale.linear()
			.domain([min_year, max_year + 1])
			.range([graph_padding, (centerbar_width + prog_descr_width + 50)]);
		var yScale = d3.scale.log()
			.clamp(true)
			.domain([1, data_max])
			.range([chart_height - graph_padding + 25, 10]);

		//Define X axis
		var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.tickFormat(d3.format("4d"))
			.tickSize(ticksize);

		//Define Y axis
		var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.tickValues(data_ticks)
			.tickFormat(d3.format("$1s"))
			.tickSize(ticksize);

		// Add X axis to Linechart
		linechart_svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (chart_height - graph_padding + 25) + ")")
			.attr("stroke-width", '1px')
			.call(xAxis);

		// Add Y axis to Linechart
		linechart_svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(" + graph_padding + ",0)")
			.attr("stroke-width", '1px')
			.call(yAxis);

		//Define Averages Line Object
		var avg_line = d3.svg.line()
			.x(function (d) { return xScale(d.YEAR); })
			.y(function (d) {
				if (d[current_category] === "NA") {
					return yScale(0);
				}
				return yScale(d[current_category]);
			});

		// Add Line Graph for Averages
		linechart_svg.append("path")
			.datum(averagesByYear)
				.attr("class", "line")
				.attr("d", avg_line)
				.attr("fill", "none")
				.attr("stroke", average_colour)
				.attr("stroke-width", '1.25px'); //A9A9A9

		linechart_svg.selectAll('circle')
			.data(averagesByYear)
				.enter().append('circle')
				.attr("class", "range_circle")
				.attr('cx', function (d) {
					return xScale(d.YEAR);
				})
				.attr('cy', function (d) {
					if (d[current_category] === "NA") {
						return yScale(0);
					}
					return yScale(d[current_category]);
				})
				.attr('r', 10)
				.classed("hidden", true)
				.on("mouseenter", function (d) {
					d3.select(this).attr('r', 3).classed("hidden", false);
				});

		// Add relevant average point
		linechart_svg.append("circle")
			.attr("id", "average_circle")
			.attr("cx", function () {
				return xScale(current_year);
			})
			.attr("cy", function () {
				return yScale(averagesByYear[current_year - min_year][current_category]);
			})
			.attr("r", 3)
			.attr("stroke-width", 1.5)
			.attr("stroke", average_colour)
			.attr("fill", background_colour);



		var linechart_legend = d3.select("#linechart_legend");

		// Checks if there's a selected county
		if (d3.select('.wc_highlight.selected')[0][0]) {
			var selected_id = d3.select('.wc_highlight.selected')[0][0].id;
			var data = rateById.get([selected_id, current_year]);
			if (data) {
				// If County Is Selected & Available Add to Chart
				data_title = data.COUNTY + " County Payment History";
				data_label = data.COUNTY + " County";
				data_sublabel = data.STATE;

				var curr_pt = {cx: current_year, cy: data[current_category]};
				var dataset = Array.apply(null, {length: max_year - min_year + 1}).map(getNum);

				// Set Up Data Summary
				var max_payment = 0;
				var max_payment_year = 1970;
				var percentile = "__?";

				dataset.forEach(function (d) {
					if (+d.cy > max_payment) {
						max_payment = d.cy;
						max_payment_year = d.cx;
					}
				});

				var data_summary = "<strong>" + data_label + "</strong>"
														+ " received its maximum payment in <strong>"
														+ max_payment_year + "</strong> of "
														+ formatCurrency(max_payment) + " and ranks in the <strong>top "
														+ percentile + "%</strong> of all counties historically";
				d3.select("#linechart_summary")
					.html(data_summary);

				// Add all information for current data

				//Define Current Data Line Object
				var line = d3.svg.line()
					.x(function (d) { return xScale(d.cx); })
					.y(function (d) { return yScale(d.cy); });

				// Add Line Graph For Current Data
				linechart_svg.append("path")
					.datum(dataset)
					.attr("class", "line")
					.attr("d", line)
					.attr("fill", "none")
					.attr("stroke", county_line_colour)
					.attr("stroke-width", '1.25px');

				// Add relevant point
				linechart_svg.append("circle")
					.attr("id", "active_circle")
					.attr("cx", function () {	return xScale(curr_pt.cx);	})
					.attr("cy", function () {	return yScale(curr_pt.cy);	})
					.attr("r", 3)
					.attr("stroke-width", 1.5)
					.attr("stroke", county_line_colour)
					.attr("fill", background_colour);

				var dataPt = [xScale(curr_pt.cx), yScale(curr_pt.cy)]
					.map(function (d) { return parseInt(d, 10); });

				chartlabel
					.classed("hidden", false)
					.attr("style", "left:" + (dataPt[0] - 9) + "px;top:" + (dataPt[1] - 38) + "px")
					.html("<div class='tooltext'>" + current_year + ": " + formatCurrency(curr_pt.cy) + "</div>" + "<div class='arrow-down center'></div>");

				var current_legend_label = linechart_legend.append("div")
					.classed("current_legend_label", true);
					current_legend_label
						.append("div")
						.classed("legend_line", true)
						.style("background-color", county_line_colour);
					current_legend_label
						.append("div")
						.classed("legend_label", true)
						.text(data_label);
					current_legend_label
						.append("div")
						.classed("", true)
						.text(data_sublabel);
			}
		}

		d3.selectAll("#linechart_title")
			.text(data_title);

		var all_counties_legend_label = linechart_legend.append("div")
			.classed("all_counties_legend_label", true);
			all_counties_legend_label
				.append("div")
				.classed("legend_line", true)
				.style("background-color", average_colour);
			all_counties_legend_label
				.append("div")
				.classed("legend_label", true)
				.html("Western States");
			all_counties_legend_label
				.append("div")
				.classed("", true)
				.html("Median of Counties<br>Receiving Funds");

	}
	function update_year() {
		'use strict';

		//Update Year Label
		d3.select("#year")
			.text(current_year);

		// Adjust Previous Year Button
		if (current_year === min_year) {
			d3.select("#prev_btn")
			.attr("disabled", true);
		} else {
			d3.select("#prev_btn")
			.attr("disabled", null);
		}

		//Adjust Next Year Button
		if (current_year === max_year) {
			d3.select("#next_btn")
			.attr("disabled", true);
		} else {
			d3.select("#next_btn")
			.attr("disabled", null);
		}

		update_counties();
		update_chart();
	}
	function update_map_title() {
		'use strict';

		//Set Up Map Title and Switch Button
		// d3.select("#map_title")
		// .html(current_payments_map + "<br>Payments");
	}
	function update_legend() {
		'use strict';

		var legend = d3.select("#legend"),
				breaks = manualBreaksById.get([inter_county.header, current_category]),
				i,
				new_key,
				break_cat,
				break_text,
				color_class;

		d3.selectAll("#legend > *").remove();

		if (current_payments_map === intra_county.header) {
			d3.select("#legend")
				.classed(intra_county.break_class, true)
				.classed(inter_county.break_class, false);
			num_categories = intra_county.num_cats;
		} else {
			d3.select("#legend")
				.classed(intra_county.break_class, false)
				.classed(inter_county.break_class, true);
			num_categories = inter_county.num_cats;
		}

		for (i = num_categories; i >= 0; i--) {
			if (current_payments_map === inter_county.header) {
				break_cat = i * (100 / num_categories);
				break_text = formatCurrency(breaks[break_cat]);
			} else {
				break_cat = (i-1) * (100 / (num_categories-1));
				break_text = intra_county.break_labels[i];
			}
			color_class = "q" + i + "-" + num_categories;

			new_key = legend.append("div")
				.classed("min_height", true)
				.classed("legend_key", true);
			new_key.append("div")
				.classed(color_class, true)
				.classed("legend_color", i !== num_categories)
				.classed("legend_color_null", i === num_categories);
			new_key.append("div")
				.classed("legend_color", i !== num_categories)
				.classed("legend_color_null", i === num_categories);
			new_key.append("div")
				.classed("legend_class",  i !== num_categories)
				.classed("legend_class_null", i === num_categories)
				.attr("height", "200px")
				.text(break_text);
		}

		if (current_payments_map === inter_county.header) {
			new_key = legend.append("div")
				.classed("min_height", true)
				.classed("legend_key", true);
			new_key.append("div")
				.classed("light_gray", true)
				.classed("legend_color", true);
			new_key.append("div")
				.classed("legend_color", true);
			new_key.append("div")
				.classed("legend_class",  true)
				.attr("height", "200px")
				.text("NONE");
		}
	}
	function update_description(obj) {
		'use strict';
		var active_area = d3.select("#program_description_area .btn-primary");
		var option_value = active_area[0][0].attributes.title.value;

		var program_text = d3.select("#program_description_text");
		program_text.html(obj[option_value]);
	}
	function update_description_title(obj) {
		'use strict';
		var program_descr_area = d3.select("#program_description_area");
		program_descr_area.select('h3').text(obj.program_title);
		update_description(obj);

	}
	function timesliderCallback(timeslider) {
		'use strict';
		current_year = timeslider.value();
		update_year();
	}

	/* :: SETUP FUNCTIONS :: */
	function setup_tooltips() {
		chartlabel = d3.select("#linechart").append("div")
			.attr("class", "tooltip hidden");
		tooltip = d3.select("#map_row").append("div")
			.attr("class", "tooltip hidden");
		menutip = d3.select("#program_menu").append("div")
			.attr("class", "tooltip hidden");
	}
	function setup_timecontrols() {
		'use strict';
		var time_controls = d3.select("#timeline_controls");
		time_controls.select("#prev_btn")
			.on("click", function () {
				if (current_year !== min_year) {
					current_year -= 1;
					timeslider.value(current_year);
					update_year();
				}
			});
		time_controls.select("#next_btn")
			.on("click", function () {
				if (current_year !== max_year) {
					current_year += 1;
					timeslider.value(current_year);
					update_year();
				}
			});

		update_year();

		timeslider = slider(min_year, max_year, centerbar_width - graph_padding, min_year, max_year)
			.value(current_year);
		timeslider.callback(function () {
			timesliderCallback(timeslider);
		});
		d3.select("#timeline").append("svg").call(timeslider);
	}
	function setup_programmenu() {
		'use strict';
		// Set Up Menu
		d3.json("data/menu.json", function (menudata) {
			menudata.menuitems.forEach(function (d) {
				var program_label = d.id;
				program_menu.set(d.id, d);

				d3.csv("data/intra_county_class_breaks/"
						+ d.id + intra_county_breaks_src, function (breaks_data) {
					var map = d3.map();
					breaks_data.forEach(function (d) {
						map.set(d.county, d);
					});
					manualBreaksById.set([intra_county.header, program_label], map);
				});

				var disabled;
				if (d.active) { disabled = null; }
				else { disabled = true; }

				d3.select("#program_menu").append("div")
					.text(d.menu_abbrev)
					.attr("id", d.id)
					.attr("program_title", d.program_title)
					.attr("class", "btn")
					.attr("disabled", disabled)
					.classed("btn-primary", current_category === d.id)
					.classed("btn-default", current_category !== d.id)
					.classed("menuitem", true)
					.on('click', function () {
						current_category = this.id;
						d3.selectAll("#program_menu .btn-primary")
							.classed("btn-primary", false)
							.classed("btn-default", true);
						d3.select(this)
							.classed("btn-primary", true)
							.classed("btn-default", false);

						var start_year = program_menu.get(current_category).start_year;
						var menu_title = program_menu.get(this.id).program_title;
						if(current_year < start_year) {
							create_maptip(menu_title + " program funds begin in " + start_year);
						}

						update_counties();
						update_legend();
						update_description_title(program_menu.get(current_category));
					})
					.on("mouseenter", function (d) {
						var mouse = d3.mouse(d3.select("#program_menu").node()).map( function(d) { return parseInt(d, 10); } );
						var menu_title = program_menu.get(this.id).program_title;
						menutip
							.classed("hidden", false)
							.attr("style", "left:"+(mouse[0] - 50)+"px;top:"+(mouse[1]+10)+"px")
							.html("<div class='tooltext'>" + menu_title+ "</div>"); // + "<div class='arrow-down center'></div>");
					})
					.on("mouseout",  function() {
						menutip.classed("hidden", true);
					});

			});

			update_description_title(program_menu.get(current_category));
		});

		d3.selectAll("#description_trends_toggle_btn_container .btn")
			.on("click", function () {
				d3.selectAll("#description_trends_toggle_btn_container > .btn-primary")
					.classed("btn-primary", false)
					.classed("btn-default", true);

				d3.select(this)
					.classed("btn-primary", true)
					.classed("btn-default", false);

				update_description(program_menu.get(current_category));
			});

	}
	function setup_counties() {
		'use strict';

		county_layer.g().classed(inter_county.break_class, true);

		var counties = d3.selectAll("g.wc")
			.attr("id", function (d) {
				return d.id;
			})
			.attr("state", function (d) {
				return d.id.split('_')[0];
			});

		var path = d3.geo.path().projection(map.projection());

		d3.selectAll("g.wc_highlight")
			.attr("id", function (d) {
				return d.id;
			})
			.on("mousedown", function () {
				d3.selectAll('.selected').classed('selected', false);
				d3.select(this).classed('selected', true);
				d3.select(this).selectAll('path').classed('selected', true);

				d3.selectAll('#' + this.id)
					.classed('selected', true)
					.selectAll('path')
						.classed('selected', true);

				update_chart();
			})
			.on("mouseenter", function (d) {
				var data = rateById.get([d.id, current_year]);

				var mouse = d3.mouse(d3.select("#d3MapSVG").node()).map( function(d) { return parseInt(d, 10); } );
				tooltip
					.classed("hidden", false)
					.attr("style", "left:"+(mouse[0] - 30)+"px;top:"+(mouse[1] + 20)+"px")
					.html("<div class='tooltext'>" + data.COUNTY + ", " + data.STATE + "</div>"); // + "<div class='arrow-down center'></div>");
			})
			.on("mouseout",  function() {
				tooltip.classed("hidden", true);
			});

		update_counties();
	}
	function setup_background() {
		d3.selectAll("g.country_background")
			.attr("filter", "url(#dropshadow)");
	}
	function setup_states() {
		// var path = d3.geo.path()
		//   .projection(map.projection());
		// d3.selectAll("g.state")
		// 	.append("svg:text")
		// 	.text(function(d){
		// 		console.log(d);
		//     return "STATE";
		//   })
		//   .attr("x", function(d){
		//     return path.centroid(d)[0];
		//   })
		//   .attr("y", function(d){
		//     return  path.centroid(d)[1];
		//   })
		//   .attr("text-anchor","middle")
		//   .attr('font-size','10px');

	}

	function setup_cities() {
		d3.selectAll("g.capital")
			.id(function(d) {
				return d.id;
			});
	}

	function setup_map_layers() {
		'use strict';

		// USA BACKGROUND
		usa_background_layer = create_layer(data.usa_background, "usa_back_wgs84_geo",
		"Background", "country_background", false)
			.on("load", setup_background);
		// USA BORDER
			// usa_border_layer = create_layer(data.usa_borders, "usa_b_wgs84_geo",
			// "Borders", "country_border", false);
		usa_foreground_layer = create_layer(data.usa_background, "usa_back_wgs84_geo",
		"Borders", "country_foreground", false);
		// OTHER STATES
		other_state_layer = create_layer(data.other_states_borders, "osb_wgs84_geo",
		"Other States", "other_state", false);
		// OTHER COUNTRIES BORDERS
		other_countries_layer = create_layer(data.other_countries_borders, "ocb_wgs84_geo",
		"Other Countries", "light_border", false);
		// HIGHLIGHTED STATES BORDERS
		highlighted_state_layer = create_layer(data.highlighted_states, "hsb_wgs84_geo",
		"Highlighted States", "state", false)
			.on("load", setup_states);
		// COUNTY LAYER
		county_layer = create_layer(data.wc, "wc_wgs84_geo", "Counties", "wc", true);
		// COUNTY-HIGHLIGHT LAYER
		county_highlight_layer = create_layer(data.wc, "wc_wgs84_geo", "Counties", "wc_highlight", true)
			.on("load", setup_counties);

			// console.log(data.cities.objects.cities_geo.geometries);
			var cities_data = data.cities.objects.cities_geo.geometries;
			cities_layer = d3.carto.layer.xyArray();

      cities_layer
	      .features(cities_data)
	      .cssClass("capital")
	      .renderMode("svg")
	      .markerSize(210)
	      .x(function(d) {
					console.log(d.coordinates[0]);
					return d.coordinates[0];
				})
	      .y(function(d) {
					return d.coordinates[1];
				})
	      .clickableFeatures(true);
				// .on("load", setup_cities);
		// cities_layer = d3.carto.layer.xyArray()
		// 	.features(data.cities)
    //   .label("Cities")
    //   .cssClass("city")
    //   .renderMode("svg")
    //   .markerSize(10)
    //   .x(function(d) {return d.coordinates[0]})
    //   .y(function(d) {return d.coordinates[0]})
    //   .clickableFeatures(true);
		// cities_layer = create_layer(data.cities, "cities_geo", "Cities", "light_border", true);
	}
	function add_map_layers() {
		/* Layers Added to the Map -- Order Matters
		* Layers are added to the visible map in the order they are added here. First on the bottom, Last on the top
		*/
		'use strict';

		map.addCartoLayer(usa_background_layer);
		map.addCartoLayer(other_countries_layer);
		map.addCartoLayer(usa_foreground_layer);

		map.addCartoLayer(other_state_layer);
		map.addCartoLayer(county_layer);
		map.addCartoLayer(highlighted_state_layer);

		map.addCartoLayer(county_highlight_layer);
		map.addCartoLayer(cities_layer);
	}
	function setup_carto_map() {
		'use strict';
		// Using Albers Projection
		projection = d3.geo.albers()
			.center([3, 25]);

		// Initialize carto map
		map = d3.carto.map();
		d3.selectAll("#map > .circle").remove();
		d3.selectAll("#map > .circle1").remove();
		d3.select("#map").call(map);

		// Map uses the Albers Projection Defined Above
		map.mode("projection");
		map.projection(projection);

		// Set Map Scale
		map.zoom().scale(1800).scaleExtent([1800,10000]);
		map.centerOn([-.27, -0.04], 'scaled');

		var map_svg = d3.select('#d3MapSVG');
		var filter = map_svg.append("defs")
			.append("filter")
				.attr("id", "dropshadow");
		filter
			.append("feGaussianBlur")
				.attr("in", "SourceAlpha")
				.attr("stdDeviation", 5);

	}
	function setup_map(err, queued_data) {
		'use strict';
		// Check for Errors -- Print to console.error
		if (err) {
			console.error(err);
			return;
		}

		// Get Data from queued data
		data.wc = queued_data[0];
		data.usa_background = queued_data[1];
		data.usa_borders = queued_data[2];
		data.other_states_borders = queued_data[3];
		data.other_countries_borders = queued_data[4];
		data.highlighted_states = queued_data[5];
		data.cities = queued_data[6];

		setup_carto_map();
		setup_map_layers();
		add_map_layers(data.all_data);

		setup_timecontrols();
		update_legend();
	}

	/* :: INIT/QUEUE FUNCTION :: */
	function queue_data() {
		'use strict';

		//Set up and Queue data
		var q = queue(1);
		q
			.defer(d3.json, "topojson_files/Western_Counties_sm/wc_wgs84_topo.json")
			.defer(d3.json, "topojson_files/USA_background/usa_back_wgs84_topo.json")
			.defer(d3.json, "topojson_files/USA_borders/usa_b_wgs84_topo.json")
			.defer(d3.json, "topojson_files/other_states_borders/osb_wgs84_topo.json")
			.defer(d3.json, "topojson_files/other_countries_background/ocb_wgs84_topo.json")
			.defer(d3.json, "topojson_files/highlighted_states_borders/hsb_wgs84_topo.json")
			.defer(d3.json, all_cities_src)
			.defer(d3.csv, all_data_src, function (d) {
				var state_county_label = 'ST_CNTY';
				var year_label = 'YEAR';
				var key = [d[state_county_label], d[year_label]];
				rateById.set(key, d);
				if (d[current_category] !== "") {
					if (+d[current_category] !== 0 || d[current_category].indexOf(0) === -1) {
						data[current_category].push(+d[current_category]);
					}
				}
				if (+d[year_label] > max_year) {
					max_year = +d[year_label];
				} else if (+d[year_label] < min_year) {
					min_year = +d[year_label];
				}
			})
			.defer(d3.csv, all_county_breaks_src, function (d) {
				var program_label = 'Program';
				manualBreaksById.set([inter_county.header, d[program_label]], d);
			})
			.defer(d3.csv, us_averages_src, function (d) {
				averagesByYear.push(d);
			});

		q.awaitAll(setup_map);
	}
	function init_data() {
		'use strict';

		//Initialize important variables
		current_year = 1979;
		min_year = current_year;
		max_year = current_year;

		current_category = "L_CFG";
		num_categories = 5;
		data[current_category] = [];
		current_payments_map = inter_county.header;

		d3.select("#map_toggle_btn")
		// .html("Switch to<br>" + intra_county.header + " Map")
			.on("click", function () {
				if (current_payments_map === inter_county.header) {
					// d3.select(this)
					// .html("Switch to<br>" + inter_county.header + " Map");
					current_payments_map = intra_county.header;
					county_layer.g().classed(inter_county.break_class, false);
					county_layer.g().classed(intra_county.break_class, true);
				} else {
					// d3.select(this)
					// .html("Switch to<br>" + intra_county.header + " Map");
					current_payments_map = inter_county.header;
					county_layer.g().classed(intra_county.break_class, false);
					county_layer.g().classed(inter_county.break_class, true);
				}
				update_map_title();
				update_legend();
				update_counties();
			});

		linechart_svg = d3.select("#linechart").append('svg')
			.attr("id", "linechart_svg")
			.on("mouseover", function(d) {

			});

		setup_tooltips();
		setup_programmenu();
		update_map_title();
	}

	/* :: CALL FUNCTIONS :: */
	init_data();
	queue_data();

})();
