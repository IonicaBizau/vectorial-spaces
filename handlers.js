$(document).ready(function() {

    var $graph = $(".graph");
    var $mainContainer = $(".main-container");
    var width = $mainContainer.outerWidth();
    var height = $mainContainer.outerHeight();
    var AXES = {
        x1: {
            x1: 10,
            y1: 500,
            x2: width - 10,
            y2: 500
        },
        x2: {
            y1: height - 10,
            y2: 10,
        },
        x: function (x) {
            return (AXES.x1.x2 - AXES.x1.x1) / 2 + x;
        },
        y: function (y) {
            return AXES.x2.y2 - 10 + (AXES.x2.y1 - AXES.x2.y2) / 2 - y;
        },
        setPosition: function (x, y, el) {
            var tr = "translate(" + AXES.x(x) + "," + AXES.y(y) + ")";
            if (el) {
                el.attr("transform", tr);
            }
            return tr;
        }
    };
    AXES.x2.x1 = AXES.x2.x2 = (AXES.x1.x2 - AXES.x1.x1) / 2;
    AXES.x1.y1 = AXES.x1.y2 = (AXES.x2.y1 - AXES.x2.y2) / 2;

    var svg = d3.select(".graph").append("svg:svg")
        .attr("width", width)
        .attr("height", height);

    var container = svg.append("g");
    var markerWidth = 6,
        markerHeight = 6,
        cRadius = 8,
        refX = cRadius + (markerWidth * 2),
        refY = -Math.sqrt(cRadius),
        drSub = cRadius + refY;

    var force = d3.layout.force()
        .nodes(d3.values([
            {
                x: 0,
                y: 0
            }
        ]))
        .size([width, height])
        .start();

    container.append("svg:defs").selectAll("marker")
        .data(["arrow"])
        .enter().append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 0)
        .attr("refY", "0")
        .attr("markerWidth", markerWidth)
        .attr("markerHeight", markerHeight)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

    var lines = container.append("svg:g").selectAll("line")
        .data([
            "x1",
            "x2"
        ])
        .enter().append("line")
        .attr("x1", function(d) {
            return AXES[d].x1;
        })
        .attr("y1", function(d) {
            return AXES[d].y1;
        })
        .attr("x2", function(d) {
            return AXES[d].x2;
        })
        .attr("y2", function(d) {
            return AXES[d].y2;
        })
        .attr("marker-end", "url(#arrow)")
        .attr("class", "link");

    var circle = container.append("svg:g").selectAll("circle")
        .data([
            {}
        ])
        .enter().append("circle")
        .attr("transform", function(d) {
            return AXES.setPosition(0, 0);
        })
        .attr("r", "4")
        .attr("fill", "#c0392b");

    var circleShadow = container.append("svg:g").selectAll("circle")
        .data([
            {

            }, {}, {}
        ])
        .enter().append("circle")
        .attr("transform", function(d) {
            return AXES.setPosition(0, 0);
        })
        .attr("r", function (d, i) {
            return 3 - i;
        });

    var text = container.append("svg:g").selectAll("text")
        .data([
            {}
        ])
        .enter().append("text")
        .attr({
            x: 10
          , y: 10
        }).text("x = 0, y = 0");


    B1 = [
        [-1, 1],
        [1, 2]
    ];
    B2 = [
        [1, 1],
        [0, 2]
    ];

    W = [10, -10];

window.getBx = function(t) {
    return [
        [
            (1 - t) * B1[0][0] + t * B2[0][0],
            (1 - t) * B1[0][1] + t * B2[0][1]
        ],
        [
            (1 - t) * B1[1][0] + t * B2[1][0],
            (1 - t) * B1[1][1] + t * B2[1][1]
        ]
    ]
}

window.computeXY = function(xy) {
    xy.x *= 10;
    xy.y *= 10;
}

    var content = "B1 = " + JSON.stringify(B1);
    content += "\nB2 = " + JSON.stringify(B2);
    content += "\nW = " + JSON.stringify(W);
    content += "\ngetBx = " + getBx.toString();
    content += "\ncomputeXY = " + computeXY.toString();
    content += "\nRANGE = [0, 1]";
    $("#inputData").val(content);

    var intervals = [];
    $(".btn.start").on("click", function () {

        for (var i in intervals) {
            clearInterval(intervals[i]);
        }

        try {
            eval($("#inputData").val());
        } catch (e) {
            alert(e.message);
            return;
        }
        var values = [];
        for (var t = RANGE[0]; t < RANGE[1]; t += 0.001) {
            var xy = getXY(t);
            if (typeof computeXY === "function") {
                computeXY(xy);
            }
            values.push(xy);
        }

        var howMany = 4;
        var cHowMany = 0;
        var tmp = setInterval(function () {

            if (++cHowMany >= howMany) {
                clearInterval(tmp);
            }

            var i = -1;
            var cInterval = null;
            var cCircle = d3.select(circleShadow[0][cHowMany - 2]);
            if (cHowMany === 1) {
                cCircle = circle;
            }
            intervals.push(cInterval = setInterval(function () {
                var xy = null;
                if (!(xy = values[++i])) {
                    return clearInterval(cInterval);
                }

                text.text("x = " + xy.x.toFixed(2) + ", y = " + xy.y.toFixed(2));
                AXES.setPosition(xy.x, xy.y, cCircle);
            }, 0.1));
        }, 100);
    });


    function getXY(t) {

        var g = getBx(t);

        // x * i[0][0] + x * i[1][0] = W[0]
        // y * i[0][1] + y * i[1][1] = W[1]
        // x = W[0] / (i[0][0] + i[1][0])
        // y = W[1] / (i[0][1] + i[1][1])

        // x * i[0][0] + y * i[1][0] = W[0]
        // x * i[0][1] + y * i[1][1] = W[1]
        console.log("x * " + g[0][0] + " + y * " + g[1][0]  + " = " + W[0]);
        console.log("x * " + g[0][1] + " + y * " + g[1][1]  + " = " + W[1]);
        var dm = g[0][0] * g[1][1] - g[0][1] * g[1][0];
        var x = (W[0] * g[1][1] - W[1] * g[1][0]) / dm;
        var y = (g[0][0] * W[1] - g[0][1] * W[0]) / dm;

        return {
            x: x,
            y: y
        }
    }

    getXY(0);

});
