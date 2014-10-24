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
            return AXES.x2.y2 * 3 + (AXES.x2.y1 - AXES.x2.y2) / 2 - y;
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
        .attr("r", "3");

    var text = container.append("svg:g").selectAll("text")
        .data([
            {}
        ])
        .enter().append("text")
        .attr({
            x: 10
          , y: 10
        }).text("Hello World");


    B1 = [
        [-1, 1],
        [1, 2]
    ];
    B2 = [
        [1, 1],
        [0, 2]
    ];

    W = [10, -10];

function getBx(t) {
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

function computeXY(xy) {
    xy.x *= 10;
    xy.y *= 10;
}

    var content = "B1 = " + JSON.stringify(B1);
    content += "\nB2 = " + JSON.stringify(B2);
    content += "\nW = " + JSON.stringify(W);
    content += "\n" + getBx.toString();
    content += "\n" + computeXY.toString();
    content += "\nRANGE = [0, 1]";
    $("#inputData").val(content);

    var interval = null;
    $(".btn.start").on("click", function () {
        clearInterval(interval);
        try {
            eval($("#inputData").val());
        } catch (e) {
            alert(e.message);
            return;
        }
        var T = RANGE[0];
        interval = setInterval(function () {
            var xy = getXY(T);
            if (typeof computeXY === "function") {
                computeXY(xy);
            }
            text.text("x = " + xy.x.toFixed(2) + ", y = " + xy.y.toFixed(2));
            AXES.setPosition(xy.x, xy.y, circle);
            if (T <= RANGE[1]) {
                T += 0.001;
            } else {
                clearInterval(i);
            }
        }, 0.1);
    });


    function getXY(t) {

        i = getBx(t);

        // (1, 1), (0, 2) => w = (3 * 1 + 3 * 0,
        // (1, 0), (0, 1) => w = (3 * 1 + 3 * 0,

        // (3, 0) + (0, 5)
        //
        //
        // (x * i[0][0] + y * i[1][0],
        //  x * i[][0] + y * i[1][1]

        // x * i[0][0] + x * i[1][0] = W[0]
        // y * i[0][1] + y * i[1][1] = W[1]
        // x = W[0] / (i[0][0] + i[1][0])
        // y = W[1] / (i[0][1] + i[1][1])
        var solver = new Solver({
            x: "(" + W[0] + " - y * " + B1[1][0] + ") / " + B1[0][0],
            y: "(" + W[1] + " - x * " + B1[0][1] + ") / " + B1[1][1],
            c: "1"
        });

        // x * i[0][0] + y * i[1][0] = W[0]
        // x * i[0][1] + y * i[1][1] = W[1]
        console.log("x * " + i[0][0] + " + y * " + i[1][0]  + " = " + W[0]);
        console.log("x * " + i[0][1] + " + y * " + i[1][1]  + " = " + W[1]);
        var dm = i[0][0] * i[1][1] - i[0][1] * i[1][0];
        var x = (W[0] * i[1][1] - W[1] * i[1][0]) / dm;
        var y = (i[0][0] * W[1] - i[0][1] * W[0]) / dm;

        return {
            x: x,
            y: y
        }
    }

    getXY(0);

});
