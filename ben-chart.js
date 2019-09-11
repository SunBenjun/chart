(function (exports) {
    "use strict";
    var _opt = {};
    var BenChart = function (opt) {
        if (opt) {
            _opt = this.opt = opt;
            this.init();
        }
    };
    var util = {
        /**
         * [subPixelOptimize 亚像素优化]
         * @param  {[type]} position  [description]
         * @param  {[type]} lineWidth [description]
         * @return {[type]}           [description]
         */
        subPixelOptimize: function (position, lineWidth) {
            if (lineWidth % 2 === 1) {
                //position += position === Math.ceil(position) ? 0.5 : 0;
                position = Math.floor(position) + 0.5;
            } else {
                position = Math.round(position);
            }
            return position;
        }
    };
    BenChart.prototype = {
        init: function () {
            _opt.mountDom = document.querySelector(_opt.mountDom);
            _opt.width = _opt.mountDom.clientWidth;
            _opt.height = _opt.mountDom.clientHeight;
            _opt.ctx = null;
            this.workspace()
                .draw()
                .callback();
        },
        //配置svg工作区
        workspace: function () {
            _opt.ctx = d3.select(_opt.mountDom)
                .append("svg")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", "0,0," + _opt.width + "," + _opt.height);
            return this;
        },
        // 页面回调
        callback: function () {
            var _this = this;
            if (this.opt.callback) {
                // 设置坐标范围
                this.setCoordinate();
                var touchFun = function (event) {
                    event.stopPropagation();
                    _this.opt.callback({
                        index: _this.getIndex(event),
                        coordinate: _this.coordinate
                    });
                };
                _this.opt.mountDom.querySelector('svg').addEventListener('touchstart', touchFun, false);
                _this.opt.mountDom.querySelector('svg').addEventListener('touchmove', touchFun, false);
            }
            return this;
        },
        // 销毁
        destory: function () {
            _this.opt.mountDom.querySelector('svg').removeEventListener('touchstart', touchFun, false);
            _this.opt.mountDom.querySelector('svg').removeEventListener('touchmove', touchFun, false);
        },
        setCoordinate: function () {
            var width = this.opt.width -
                this.opt.coordinateOffsets.left -
                this.opt.coordinateOffsets.right + (this.opt.addWidth || 0);

            this.coordinate = [];

            for (var i = 0; i < this.opt.ticks.x; i++) {
                this.coordinate.push({
                    x: [
                        this.opt.coordinateOffsets.left + (width / this.opt.ticks.x) * i,
                        this.opt.coordinateOffsets.left + (width / this.opt.ticks.x) * (i + 1),
                    ],
                    y: [
                        this.opt.coordinateOffsets.top,
                        this.opt.height - this.opt.coordinateOffsets.bottom
                    ]
                });
            }
        },
        // 获取索引
        getIndex: function (event) {
            var x = event.changedTouches[0].clientX - this.opt.mountDom.offsetLeft;
            var index = -1;
            for (var i = 0; i < this.coordinate.length; i++) {
                if (x >= this.coordinate[i].x[0] &&
                    x <= this.coordinate[i].x[1]) {
                    index = i;
                    break;
                }
            }
            return index;
        },
        // 画图
        draw: function () {
            var process = function (D) {
                this.setArea(D)
                    .setGride(D)
                    .setScale(D)[D.type](D)
                    .setAxis(D);
            }.bind(this);
            // 判断是否是数组
            if (Array.isArray(_opt.data)) {
                _opt.data.forEach(function (o, i) {
                    process(o);
                }.bind(this));
            } else if (typeof _opt.data === "object" && Object.getOwnPropertyNames(_opt.data).length) {
                process(_opt.data);
            } else {
                // error
            }
            return this;
        },
        //计算区域
        setArea: function (opt) {
            // 获取坐标轴区域
            opt.area = {
                width: _opt.width - _opt.coordinateOffsets.left - _opt.coordinateOffsets.right + (_opt.addWidth || 0),
                height: _opt.height - _opt.coordinateOffsets.top - _opt.coordinateOffsets.bottom
            };
            return this;
        },
        //设置比例尺
        setScale: function (opt) {
            //x轴比例尺
            opt.xScale = d3.scaleBand()
                .domain(opt.axisX ? opt.axisX.data : d3.range(_opt.ticks.x))
                .rangeRound([0, opt.area.width]);
            //y轴比例尺
            opt.yScale = d3.scaleLinear()
                .domain([opt.min, opt.max])
                .range([opt.area.height, 0]);
            return this;
        },
        //设置坐标轴
        setAxis: function (opt) {
            // x轴坐标
            if (opt.axisX) {
                _opt.ctx.append("g")
                    .attr("class", "axisX")
                    .attr("transform", "translate(" +
                        _opt.coordinateOffsets.left + "," +
                        (_opt.coordinateOffsets.top + opt.area.height + 0.5) +
                        ")")
                    .call(
                        d3.axisBottom(opt.xScale)
                        .tickValues(opt.axisX.data)
                        .tickSizeInner(0)
                        .tickSizeOuter(0)
                        .tickPadding(7))
                    .selectAll(".tick")
                    .attr("transform", function (d, i) {
                        d3
                            .select(this)
                            .select('text')
                            .attr("fill", function () {
                                var fill = opt.axisX.attr.fill;
                                if (opt.axisX.attr.format && opt.axisX.attr.format(d, i)) {
                                    fill = opt.axisX.attr.format(d, i);
                                }
                                return fill;
                            });
                        return "translate(" +
                            (opt.area.width / _opt.ticks.x * i + opt.area.width / _opt.ticks.x / 2) +
                            ",0)";
                    });

            }
            //y轴坐标
            if (opt.axisY) {
                var axisY = opt.axisY,
                    tick = axisY.tick || {};
                _opt.ctx.append("g")
                    .attr("class", "axisY")
                    .attr("transform", "translate(" +
                        0 + "," + (_opt.coordinateOffsets.top) + ")")
                    .call(d3.axisRight(opt.yScale)
                        .tickValues(opt.axisY.data)
                        .tickSizeInner(tick.sizeInner || 0)
                        .tickSizeOuter(tick.sizeOuter || 0)
                        .tickPadding(tick.padding || 0)
                    )
                    .selectAll("text")
                    .text(function (d, i) {
                        return tick.format(d, i).value;
                    })
                    .attr("y", function (d, i) {
                        return tick.format(d, i).y;
                    });
            }
            return this;
        },
        //设置网格线
        setGride: function (opt) {
            var _this = this;
            if (opt.grid) {
                if (opt.grid.hLine && opt.grid.hLine.data) {
                    opt.grid.hLine.data.forEach(function (e, i) {
                        if (e.show) {
                            var width = util.subPixelOptimize(
                                opt.area.height / (opt.grid.hLine.data.length - 1) * i + _opt.coordinateOffsets.top,
                                e.attr.strokeWidth
                            );
                            var obj = {
                                x1: _opt.coordinateOffsets.left,
                                y1: width,
                                x2: _opt.width - _opt.coordinateOffsets.right,
                                y2: width
                            };
                            _opt.ctx
                                .append("line")
                                .attr("class", "guide")
                                .attr("x1", obj.x1)
                                .attr("y1", obj.y1)
                                .attr("x2", obj.x2)
                                .attr("y2", obj.y2)
                                .attr("stroke", e.attr.stroke)
                                .attr("stroke-width", e.attr.strokeWidth)
                                .attr("stroke-dasharray", e.attr.dasharray);
                        }
                    });
                }
            }
            return this;
        },
        // 获取柱形图起画位置
        getColumnY: function (opt, d, i) {
            // 高度
            var h = opt.area.height - opt.yScale(d);
            // 底座高度
            var bh = 0;
            // 柱形高度
            if (h > 0 && h < 1) {
                h = 1;
            }
            // 底座高度
            if (opt.base && opt.base[i]) {
                bh = opt.area.height - opt.yScale(opt.base[i]);
                if (bh > 0 && bh < 1) {
                    bh = 1;
                }
            }
            return opt.area.height - h - bh;
        },
        // 柱形图
        column: function (opt) {
            var _this = this;
            // 生成柱形图
            _opt.ctx.append("g")
                .attr("class", "column")
                .attr("transform",
                    "translate(" + _opt.coordinateOffsets.left + "," + _opt.coordinateOffsets.top + ")")
                .selectAll(".rect")
                .data(opt.data)
                .enter()
                .append("g")
                .append("rect")
                .attr("x", function (d, i) {
                    return opt.area.width / _opt.ticks.x * i + opt.spacing / 2;
                })
                .attr("y", function (d, i) {
                    return _this.getColumnY(opt, d, i);
                })
                .attr("width", function () {
                    return opt.area.width / _opt.ticks.x - opt.spacing;
                })
                .attr("height", function (d) {
                    if (!isNaN(d) && d !== null) {
                        var h = opt.area.height - opt.yScale(d);
                        // 柱形图预留最小高度
                        if (h > 0 && h < 1) {
                            h = 1;
                        }
                        return h;
                    } else {
                        return 0;
                    }
                })
                .attr("fill", function (d, i) {
                    var fill = opt.attr.fill;
                    if (opt.attr.format && opt.attr.format(d, i)) {
                        fill = opt.attr.format(d, i);
                    }
                    return fill;
                });
            return this;
        },
        //饼图
        pie: function (opt) {
            var arc = d3.arc()
                .innerRadius(opt.innerRadius)
                .outerRadius(opt.outerRadius);
            // 饼图构造器
            var pie = d3.pie();
            // 创建折线
            _opt.ctx
                .append("g")
                .attr("class", "pie")
                .attr("transform", "translate(" + _opt.coordinateOffsets.left + "," + _opt.coordinateOffsets.top + ")")
                .selectAll('path')
                .data(pie(opt.data))
                .enter()
                .append("path")
                .attr("transform", function () {
                    return "translate(" + opt.x + "," + opt.y + ")";
                })
                .attr('d', arc)
                .attr("stroke-width", opt.attr.strokeWidth)
                .attr("stroke", opt.attr.stroke)
                .attr("fill", opt.attr.fill);
            return this;
        },
        // 折线图
        line: function (opt) {
            var _this = this;
            var newData = [].concat(opt.data);
            // 线构造器
            var lineCreator = function () {
                if (opt.data.length === 1) {
                    newData.push(opt.data[0]);
                }
                return d3.line()
                    .x(function (d, i) {
                        var x;
                        if (opt.data.length === 1) {
                            x = opt.area.width / _opt.ticks.x / 2 + i * 2;
                        } else {
                            x = opt.area.width / _opt.ticks.x * i + opt.area.width / _opt.ticks.x / 2;
                        }
                        return x;
                    })
                    .y(function (d, i) {
                        var y = opt.yScale(d);
                        return y;
                    })
                    .defined(function (d, i) {
                        return !isNaN(d) && d !== null;
                    });
            }();

            // 连结点 圆滑
            if (opt.curve) {
                lineCreator.curve(d3.curveNatural);
            }
            // 创建折线
            _opt.ctx
                .append("g")
                .attr("class", "line")
                .attr("transform", "translate(" + _opt.coordinateOffsets.left + "," + _opt.coordinateOffsets.top + ")")
                .append('path')
                .attr('d', lineCreator(newData))
                .attr('stroke-width', opt.attr.strokeWidth)
                .attr('stroke', opt.attr.stroke)
                .attr('fill', 'none');

            if (opt.decorate && opt.decorate.index) {
                opt.decorate.index.forEach(function (index) {
                    if (!isNaN(opt.data[index])) {
                        var obj = {
                            // 内半径
                            innerRadius: opt.decorate.innerRadius,
                            // 外半径
                            outerRadius: opt.decorate.outerRadius,
                            // 中心点 x
                            x: opt.area.width / _opt.ticks.x * index + opt.area.width / _opt.ticks.x / 2,
                            // 中心点 Y
                            y: opt.yScale(newData[index]),
                            // 数据
                            data: opt.decorate.data,
                            // 属性
                            attr: {
                                strokeWidth: opt.decorate.attr.strokeWidth,
                                stroke: opt.decorate.attr.stroke,
                                fill: opt.decorate.attr.fill
                            }
                        };
                        // 饼图生成
                        _this.pie(obj);
                    }
                });
            }
            return this;
        },
        /*面积图 */
        area: function (opt) {
            var newData = [].concat(opt.data);
            // 渐变颜色
            var linearGradient = _opt.ctx.append('defs').append('linearGradient')
                .attr('id', 'linearColor-' + opt.key)
                .attr('x1', '0%')
                .attr('y1', '0%')
                .attr('x2', '0%')
                .attr('y2', '100%');
            // 渐变开始颜色
            linearGradient.append('stop')
                .attr('offset', '0%')
                .style('stop-color', opt.shadow.attr.fill[0])
                .style('stop-opacity', opt.shadow.opacity[0]);
            // 渐变结束颜色                
            linearGradient.append('stop')
                .attr('offset', '100%')
                .style('stop-color', opt.shadow.attr.fill[1])
                .style('stop-opacity', opt.shadow.opacity[1]);
            // 面积构造器
            var areaCreator = function () {
                if (opt.data.length === 1) {
                    newData.push(opt.data[0]);
                }
                return d3.area()
                    .x(function (d, i) {
                        var x;
                        if (opt.data.length === 1) {
                            x = opt.area.width / _opt.ticks.x / 2 + i * 2;
                        } else {
                            x = opt.area.width / _opt.ticks.x * i + opt.area.width / _opt.ticks.x / 2;
                        }
                        return x;
                    })
                    .y(function (d, i) {
                        return opt.yScale(d);
                    })
                    .y1(function (d, i) {
                        return opt.yScale(0);
                    })
                    .defined(function (d, i) {
                        return !isNaN(d) && d !== null;
                    });
            }();
            // 创建面积图
            _opt.ctx
                .append("g")
                .attr("class", 'area')
                .attr("transform", "translate(" + _opt.coordinateOffsets.left + "," + _opt.coordinateOffsets.top + ")")
                .append('path')
                .attr('d', areaCreator(newData))
                .style('fill', 'url(#' + linearGradient.attr('id') + ')');
            return this;
        }
    };
    exports.BenChart = BenChart;
})(window);
