const svgNS = "http://www.w3.org/2000/svg";

class Chart {
  constructor(props) {
    this.width = props.width;
    this.height = props.height;
    this.chartDirection = props.chartDirection;
    this.showAxes = props.showAxes;
    this.xAxis = props.xAxis;
    this.yAxis = props.yAxis;
    this.grid = props.grid;
    this.gridDirection = props.gridDirection;
    this.animate = props.animate;
    this.body = document.createElementNS(svgNS, "svg");
    this.chartProps = {
      width: this.width,
      height: this.height,
      chartDirection: this.chartDirection,
      showAxes: this.showAxes,
      xAxis: props.xAxis,
      yAxis: props.yAxis,
      grid: this.grid,
      gridDirection: this.gridDirection,
      animate: this.animate,
    };
  }

  draw(data, style) {
    ChartAutoUI.adjustScaling(this.body, data, this.chartProps);

    if (style === "line")
      ChartStyles.lineChart(this.body, data, this.chartProps);
    else if (style === "block")
      ChartStyles.blockChart(this.body, data, this.chartProps);
  }

  changeStyle(style) {
    let data = [];

    this.body.querySelectorAll(".data-holder").forEach((el) => {
      data.push(+el.getAttribute("data-value"));
      el.remove();
    });

    this.body.querySelector(".chart__line")
      ? this.body.querySelector(".chart__line").remove()
      : false;

    this.draw(data, style);
  }

  mountTo(parent) {
    ChartUI.createChartBody(this.body, parent, this.chartProps);

    ChartAutoUI.adjustHeight(this.body, this.width, this.height);
    ChartAutoUI.adjustResponsive(this.body, this.width);
    ChartAutoUI.adjustXReadings(this.body);

    window.addEventListener("resize", () => {
      ChartAutoUI.adjustHeight(this.body, this.width, this.height);
      ChartAutoUI.adjustResponsive(this.body, this.width);
      ChartAutoUI.adjustXReadings(this.body);
    });
  }
}

class ChartUI {
  static createChartBody(chartBody, parent, chartProps) {
    const tooltip = document.createElement("div");
    const figure = document.createElement("figure");

    const { width, height, grid, showAxes, chartDirection } = chartProps;

    chartBody.classList.add("chart");
    chartBody.setAttribute("height", height);
    chartBody.setAttribute("viewBox", `-30 -20 ${width + 60} ${height + 40}`);
    chartBody.setAttribute("preserveAspectRatio", "xMinYMin meet");
    chartBody.style.direction = chartDirection || "ltr";

    // Handling chart click event
    chartBody.addEventListener("click", () => {
      if (tooltip.classList.contains("active")) {
        ChartUI.disableChartPoints();

        tooltip.classList.remove("active");
      }
    });

    const zeroReading = document.createElementNS(svgNS, "text");
    zeroReading.textContent = "0";
    zeroReading.classList.add("chart__reading");
    zeroReading.setAttribute("x", "0");
    zeroReading.setAttribute("y", height);

    chartBody.appendChild(zeroReading);

    // For y axis position
    const x = chartDirection === "rtl" ? width : 0;

    if (showAxes) {
      const axes = `<line class="chart__axis" x1="0" 
      y1="${height}" 
      x2="${width}" 
      y2="${height}"></line>
      <line class="chart__axis" x1="${x}" y1="0" x2="${x}" y2="${height}"></line>`;

      chartBody.insertAdjacentHTML("beforeend", axes);

      // setTimeout is because the appending time is relatively slow (to be modified)
      setTimeout(() => {
        zeroReading.setAttribute("text-anchor", "end");
        zeroReading.setAttribute(
          "x",
          chartDirection === "rtl" ? width + 5 : "0"
        );
        zeroReading.setAttribute("y", height);
      });
    } else {
      // setTimeout is because the appending time is relatively slow (to be modified)
      setTimeout(() => {
        const readingHeight = zeroReading.getBoundingClientRect().height;

        zeroReading.setAttribute("text-anchor", "middle");
        zeroReading.setAttribute("x", chartDirection === "rtl" ? width : "0");
        zeroReading.setAttribute("y", height + readingHeight + 7);
      });
    }

    // Creating tooltip content
    const tooltipXReading = document.createElement("h4");
    const tooltipYReading = document.createElement("p");

    tooltipXReading.classList.add("Chart__tooltip__title");
    tooltipXReading.textContent = "X value";

    tooltipYReading.classList.add("Chart__tooltip__body");
    tooltipYReading.textContent = "label: Y value";

    tooltip.classList.add("chart__tooltip");
    tooltip.append(tooltipXReading);
    tooltip.append(tooltipYReading);

    figure.classList.add("chart-holder");

    figure.append(tooltip, chartBody);

    parent.appendChild(figure);

    if (grid === "on") ChartUI.createGrid(chartBody, chartProps);
    ChartUI.createReadings(chartBody, "x", chartProps);
    ChartUI.createReadings(chartBody, "y", chartProps);
  }

  static createChartPoint(x, y) {
    const chartPoint = document.createElementNS(svgNS, "circle");

    chartPoint.classList.add("chart__point");
    chartPoint.setAttribute("cx", x);
    chartPoint.setAttribute("cy", y);
    chartPoint.setAttribute("r", 3);
    chartPoint.setAttribute("data-value", "");

    return chartPoint;
  }

  // Handle chart points hover and click events
  static handleChartTooltip(point, pointVal, tooltip) {
    point.addEventListener("mouseover", () => {
      if (!tooltip.classList.contains("active"))
        this.showTooltip(point, tooltip, pointVal);
    });

    point.addEventListener("mouseout", () => {
      tooltip.classList.remove("show");

      tooltip.classList.contains("active")
        ? setTimeout(() => {
            this.removeActiveClass(elements);

            tooltip.classList.remove("active");
          }, 1500)
        : false;
    });
  }

  // Grid property
  static createGrid(chart, chartProps) {
    const { width, height, gridDirection, xAxis, yAxis } = chartProps;

    if (gridDirection === "horizontal" || gridDirection === "both") {
      const yVariation = height / (yAxis.steps || 6);
      const yAdjustment = height - yVariation;

      for (let i = 0; i < yAxis.steps; i++) {
        const line = document.createElementNS(svgNS, "line");
        const yValue = yAdjustment - yVariation * i;

        line.classList.add("chart__grid-line");
        line.setAttribute("x1", "0");
        line.setAttribute("y1", yValue);
        line.setAttribute("x2", width);
        line.setAttribute("y2", yValue);

        chart.prepend(line);
      }
    }

    if (gridDirection === "vertical" || gridDirection === "both") {
      const xVariation = width / (xAxis.steps || 6);
      const xAdjustment = width - xVariation;

      for (let i = 0; i < xAxis.steps; i++) {
        const line = document.createElementNS(svgNS, "line");
        const xValue = xAdjustment - xVariation * i;

        line.classList.add("chart__grid-line");
        line.setAttribute("x1", xValue);
        line.setAttribute("y1", "0");
        line.setAttribute("x2", xValue);
        line.setAttribute("y2", height);

        chart.prepend(line);
      }
    }
  }

  static createReadings(chart, axis, chartProps) {
    const { width, height, xAxis, yAxis, chartDirection } = chartProps;

    // !==== create an object once depending on the axis
    const numOfReadings = axis === "x" ? xAxis.steps : yAxis.steps;
    const maxReading = axis === "x" ? xAxis.max : yAxis.max;

    // Getting reading value step
    const step = axis === "x" ? width / numOfReadings : height / numOfReadings;

    const minChartReading = maxReading / numOfReadings;

    // Appending readings
    for (let i = 1; i <= numOfReadings; i++) {
      const reading = document.createElementNS(svgNS, "text");

      reading.classList.add("chart__reading");
      reading.textContent = Math.round(i * minChartReading);
      reading.setAttribute("x", "0");
      reading.setAttribute("y", "0");

      chart.appendChild(reading);

      const readingWidth = reading.getBoundingClientRect().width;
      const readingHeight = reading.getBoundingClientRect().height;

      // Postioning readings
      if (axis === "x") {
        reading.classList.add("chart__reading--x");
        reading.setAttribute(
          "x",
          chartDirection === "rtl"
            ? width - (step * i - readingWidth / 2)
            : step * i - readingWidth / 2
        );
        reading.setAttribute("y", `${height + readingHeight + 5}`);
      } else {
        reading.classList.add("chart__reading--y");
        reading.setAttribute("text-anchor", "end");
        reading.setAttribute("x", chartDirection === "rtl" ? width + 5 : "-5");
        reading.setAttribute("y", `${height - step * i + readingHeight / 4}`);
      }
    }

    ChartAutoUI.adjustXReadings(chart);
  }

  static showTooltip(point, tooltip, tooltipContent) {
    // Getting hover position
    const pointProps = point.getBoundingClientRect();

    const pointXLocation = pointProps.left;
    const pointYLocation = pointProps.top;

    tooltip.classList.add("show");
    tooltip.style.left = point.classList.contains("chart__block")
      ? `${pointXLocation + pointProps.width / 2}px`
      : `${pointXLocation}px`;
    tooltip.style.top = `${pointYLocation - tooltip.scrollHeight / 2 - 10}px`;

    const xReading = tooltip.querySelector(".Chart__tooltip__title");
    const yReading = tooltip.querySelector(".Chart__tooltip__body");

    xReading.textContent = tooltipContent ? tooltipContent.x : "X value";
    yReading.textContent = tooltipContent ? tooltipContent.y : "yLabel: value";

    window.addEventListener("scroll", () => {
      tooltip.classList.remove("show");
      tooltip.classList.remove("active");
    });
  }
}

class ChartStyles {
  static lineChart(chart, data, chartProps) {
    const { width, height, xAxis, yAxis, animate, chartDirection } = chartProps;

    const maxReading = Math.max(...data);
    let minimizationRatio = 1;
    const correctionFactor = Math.max(...data) / yAxis.max;

    let linePoints = chartDirection === "rtl" ? `${width},0` : `0,0`;

    if (maxReading > height) minimizationRatio = height / maxReading; //causes positon error

    const chartLine = document.createElementNS(svgNS, "polyline");
    const pointsGroup = document.createElementNS(svgNS, "g");

    pointsGroup.classList.add("chart__points-group");
    pointsGroup.setAttribute(
      "transform",
      `scale(1,-1) translate(0,-${height})`
    );

    for (let i = 0; i < data.length; i++) {
      const finalData = data[i] * minimizationRatio;
      const xPos =
        chartDirection === "rtl"
          ? width - (width / xAxis.steps) * (i + 1)
          : (width / xAxis.steps) * (i + 1);

      const xActualVal =
        chartDirection === "rtl"
          ? xAxis.max -
            (xPos / (width / xAxis.steps)) * (xAxis.max / xAxis.steps)
          : (xPos / (width / xAxis.steps)) * (xAxis.max / xAxis.steps);
      const y = correctionFactor < 1 ? finalData * correctionFactor : finalData;

      const chartPoint = ChartUI.createChartPoint(xPos, y);
      chartPoint.classList.add("data-holder");
      chartPoint.setAttribute("data-value", data[i]);

      const tooltip = chart.parentElement.querySelector(".chart__tooltip");
      const tooltipValues = {
        x: `${xAxis.label}: ${xActualVal}`,
        y: `${yAxis.label}: ${data[i]}`,
      };

      ChartUI.handleChartTooltip(chartPoint, tooltipValues, tooltip);

      pointsGroup.appendChild(chartPoint);

      linePoints = linePoints.concat(` ${xPos},${y}`);
    }

    chartLine.classList.add("chart__line");
    chartLine.setAttribute("points", linePoints);
    pointsGroup.prepend(chartLine);

    chart.appendChild(pointsGroup);

    if (animate !== undefined)
      chartLine.style.animationDuration = `${animate}s`;

    const l = this.getPolylineLength(chartLine);
    chartLine.style.strokeDasharray = `${l * 2}px`;
    chartLine.style.strokeDashoffset = `${l * 2}px`;
  }

  //Gettting polyline length for animation
  static getPolylineLength(line) {
    let totalLength = 0;

    for (let i = 1; i < line.points.numberOfItems; i++) {
      const x1 = line.points.getItem(i - 1).x;
      const y1 = line.points.getItem(i - 1).y;

      const x2 = line.points.getItem(i).x;
      const y2 = line.points.getItem(i).y;

      totalLength += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    return Math.ceil(totalLength);
  }

  static blockChart(chart, data, chartProps) {
    const { width, height, xAxis, yAxis, animate, chartDirection } = chartProps;

    const maxReading = Math.max(...data);
    const minimizationRatio = maxReading > height ? height / maxReading : 1;
    const correctionFactor = maxReading / yAxis.max;

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", `scale(1,-1) translate(0,-${height})`);

    for (let i = 0; i < data.length; i++) {
      const chartBlock = document.createElementNS(svgNS, "rect");

      const finalData = data[i] * minimizationRatio;

      const xPos =
        chartDirection === "rtl"
          ? width - (width / xAxis.steps) * (i + 1)
          : (width / xAxis.steps) * (i + 1);

      const xActualVal =
        chartDirection === "rtl"
          ? xAxis.max -
            (xPos / (width / xAxis.steps)) * (xAxis.max / xAxis.steps)
          : (xPos / (width / xAxis.steps)) * (xAxis.max / xAxis.steps);

      const blockWidth = width / xAxis.steps;

      chartBlock.classList.add("chart__block");
      chartBlock.classList.add("data-holder");

      chartBlock.setAttribute("data-value", data[i]);
      chartBlock.setAttribute("x", xPos - blockWidth / 4);
      chartBlock.setAttribute("y", 0);
      chartBlock.setAttribute("width", blockWidth / 2);
      chartBlock.setAttribute(
        "height",
        correctionFactor < 1
          ? Math.round(finalData * correctionFactor)
          : Math.round(finalData)
      );

      const tooltip = chart.parentElement.querySelector(".chart__tooltip");

      const tooltipValues = {
        x: `${xAxis.label}: ${xActualVal}`,
        y: `${yAxis.label}: ${data[i]}`,
      };

      ChartUI.handleChartTooltip(chartBlock, tooltipValues, tooltip);

      g.appendChild(chartBlock);

      if (animate !== undefined) {
        const animation = document.createElementNS(svgNS, "animate");
        animation.setAttribute("attributeName", "height");
        animation.setAttribute("from", "0");
        animation.setAttribute("to", finalData);
        animation.setAttribute("dur", `${animate}s`);

        chartBlock.appendChild(animation);
      }
    }

    chart.appendChild(g);
  }
}

class ChartAutoUI {
  static adjustResponsive(chart, width) {
    const newWidth = chart.getBoundingClientRect().width;

    // Getting fixed fontSize & points size view
    const newFontSize = 10 * (width / parseInt(newWidth));
    const newPointSize = (3 * width) / parseInt(newWidth);

    document
      .querySelectorAll(".chart__reading")
      .forEach((el) => (el.style.fontSize = `${newFontSize}px`));

    document
      .querySelectorAll(".chart__point")
      .forEach((el) => el.setAttribute("r", newPointSize));
  }

  static adjustHeight(chart, width, height) {
    const newWidth = window.innerWidth;

    const scaledHeight = (height * newWidth) / width;

    // For scalling issues
    if (window.innerWidth < width)
      chart.setAttribute("height", scaledHeight - 10);
    else chart.setAttribute("height", height);
  }

  static adjustXReadings(chart) {
    const xReadings = Array.from(
      chart.parentElement.querySelectorAll(".chart__reading--x")
    );

    const totalWidth = xReadings.reduce(
      (totalWidth, el) => totalWidth + 7 * el.textContent.length,
      0
    );

    if (totalWidth > chart.getBoundingClientRect().width) {
      xReadings
        .slice(0, xReadings.length - 1)
        .forEach((el) => (el.style.opacity = "0"));
    } else {
      xReadings
        .slice(0, xReadings.length - 1)
        .forEach((el) => (el.style.opacity = "1"));
    }
  }

  // Adjust y-axis readings and correcting height with respect to new reading
  static adjustScaling(chart, data, chartProps) {
    const { width, yAxis, chartDirection } = chartProps;
    const maxReading = Math.max(...data);

    if (yAxis.max < maxReading) {
      const correctionFactor = yAxis.max / maxReading;
      const newReadingSteps = maxReading / yAxis.steps;

      chart
        .querySelectorAll(".chart__reading--y")
        .forEach(
          (el, i) => (el.textContent = Math.round(newReadingSteps * (i + 1)))
        );

      const pointsGroups = Array.from(
        chart.querySelectorAll(".chart__points-group")
      );

      pointsGroups.forEach((group) => {
        const chartPoints = Array.from(group.querySelectorAll(".data-holder"));

        chartPoints.forEach((el) => {
          const newY = +el.getAttribute("cy") * correctionFactor;

          el.setAttribute("cy", newY);
        });

        const newLinePoints = chartPoints.map(
          (el) => `${el.getAttribute("cx")},${el.getAttribute("cy")}`
        );

        group
          .querySelector(".chart__line")
          .setAttribute(
            "points",
            `${chartDirection === "rtl" ? width : "0"},0 ${newLinePoints.join(
              " "
            )}`
          );
      });

      chart.querySelectorAll(".data-holder").forEach((el) => {
        const newHeight = +el.getAttribute("height") * correctionFactor;

        el.setAttribute("height", newHeight);
      });

      yAxis.max = maxReading;
    } else {
      const correctionFactor = maxReading / yAxis.max;

      for (let i = 0; i < data.length; i++) {
        data[i] = data[i] * correctionFactor;
      }
    }
  }
}
