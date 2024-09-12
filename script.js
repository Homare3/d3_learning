function chart() {
// グラフの設定
const margin = { top: 20, right: 120, bottom: 30, left: 50 }; // 右側の余白を増やす
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// ツールチップの作成
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// データを読み込む
d3.json("./data/accident_data_d3.json").then(data => {
    // 時間帯ごとのリスト
    const times = ["早朝", "朝", "昼前", "昼", "夕方", "夜", "深夜"];

    // データを曜日ごとにネスト
    const nestedData = d3.groups(data, d => d.day).map(([day, values]) => {
        const obj = { day: day };
        values.forEach(v => {
            obj[v.time] = v.count;
        });
        return obj;
    });

    // 積み上げデータの準備
    const stack = d3.stack()
        .keys(times)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const series = stack(nestedData);

    // スケール設定
    const x = d3.scaleBand()
        .domain(nestedData.map(d => d.day))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
        .nice()
        .range([height, 0]);

    // 色のカスタマイズ（より濃い色と鮮やかなパレット）
    const color = d3.scaleOrdinal()
        .domain(times)
        .range(["#d73027", "#f46d43", "#fdae61", "#fee08b", "#66bd63", "#1a9850", "#006837"]);

    // X軸
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => ["日", "月", "火", "水", "木", "金", "土"][d - 1]));

    // Y軸
    svg.append("g")
        .call(d3.axisLeft(y));

    // 積み上げ棒グラフ描画
    svg.selectAll("g.layer")
        .data(series)
        .enter()
        .append("g")
        .attr("class", "layer")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.day))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1);
        })
        .on("mousemove", (event, d) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .html(`曜日: ${["日", "月", "火", "水", "木", "金", "土"][d.data.day - 1]}<br>
                       時間帯: ${times.find((t, i) => d[1] - d[0] === d.data[t])}<br>
                       件数: ${d[1] - d[0]}`);
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        })
        .transition()
        .duration(800)
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .delay((d, i) => i * 100);

    // 凡例の位置をグラフの右側に移動
    const legend = svg.selectAll(".legend")
        .data(times)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width + 20},${i * 20})`); // 右側に配置

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d);
});
};
chart();