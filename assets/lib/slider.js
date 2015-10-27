function slider(dom1, dom2, parent_width, min_year, max_year)
{
    var margin = {top: -10, left: 20, right: 20, bottom: 0},
        width  = parent_width - margin.left - margin.right,
        height = 30  - margin.top  - margin.bottom,
        brush  = d3.svg.brush(),
        handle, slider,
        value  = 0,
        tick_values = [],
        remainder = min_year % 5,
        i = min_year,
        upd    = function(d){value = d;},
        cback  = function(d){};
    var x = d3.scale.linear()
        .domain([dom1,dom2])
        .range ([0,width])
        .clamp(true);

    for (i = min_year - remainder; i <= max_year; i = i + 5) {
      tick_values.push(i);
    }

    function chart(el)
    {

        brush.x(x).extent([0,0])
             .on("brush", brushed);

        var svg = el.attr("width",  width  + margin.left + margin.right)
            .attr("height", height + margin.top  + margin.bottom)
            .append("g").attr("transform","translate("
                              + margin.left + "," + margin.top + ")");

        var filter = svg.append("defs")
      	  .append("filter")
      	    .attr("id", "image")
            .attr("x", "0%")
            .attr("y", "0%")
            .attr("width", "100%")
            .attr("height", "100%");
      	filter
      	  .append("feImage")
      	    .attr("xlink:href", "assets/images/timeline_brush.png");

        svg.append("rect")
          .attr("class", "grid-background")
          .attr("transform", "translate(" + (-margin.left) + "," + ((height/2)-2.5) + ")")
          .attr("width", width + margin.right + margin.left)
          .attr("height", 5);

        svg.append("g")
            .attr("class","x axis")
            .attr("transform", "translate(0,"+((height/2)-2.5)+")")
            .call(d3.svg.axis()
                  .scale(x)
                  .orient("bottom")
                  .tickFormat(d3.format("4d"))
                  .tickSize(5)
                  .tickPadding(7)
                  .tickValues(tick_values)
                 );

        slider = svg.append("g")
            .attr("class","slider")
            .call(brush);

        slider.selectAll(".extent,.resize").remove();
        slider.select(".background").attr("height",height)

        handle = slider.append("circle")
            .attr("class","handle")
            .attr("filter", "url(#image)")
            .attr("transform", "translate(0,"+height/2+")")
            .attr("cx",x(value))
            .attr("r",11);

        function brushed()
        {
            var zero = d3.format("04d");
            if (d3.event.sourceEvent) value = d3.round(x.invert(d3.mouse(this)[0]));
            upd(value);
            cback();
        }
        upd = function(v)
        {
            brush.extent([v,v]);
            value = brush.extent()[0];
            handle.attr("cx",x(value));
        }
    }

    chart.margin   = function(_) { if (!arguments.length) return margin;  margin = _; return chart; };
    chart.callback = function(_) { if (!arguments.length) return cback;    cback = _; return chart; };
    chart.value    = function(_) { if (!arguments.length) return value;       upd(_); return chart; };

    return chart;
}
