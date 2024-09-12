// csvファイルをjsonファイルに変換
function load_data(txt) {
  $.ajax({
    url: "./data/data.csv",
    type: "GET",
  })
    .done("data", function (data) {
      const send_data = Papa.parse(data, { header: true, dynamicTyping: true });
      // pie_graph関数にデータを渡し描画
      pie_graph(send_data.data, txt);
    })
    .fail(function (data) {
      return null;
    });
}

function pie_graph(data, txt) {
  var width = 450;
  var height = 400;
  var radius = Math.min(width, height - 50) / 2 - 10;

  var svg = d3
    .select("#pie_graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text(txt);

  // (0,0)が円の中心になっており、1/4しか表示されないため中心を移動
  g = svg
    .append("g")
    .attr(
      "transform",
      "translate(" + width / 2 + "," + (height / 2 + 20) + ")"
    );

  // 色分け
  var color = d3.scaleOrdinal(d3.schemeCategory10);

  // パーセント表示のために合計を計算
  var total = d3.sum(data, function (d) {
    return d.val;
  });

  // pie関数でデータを円グラフの形式に変換
  var pie = d3
    .pie()
    .value(function (d) {
      return d.val;
    })
    .sort(null);
  // pieクラスを選択し、データと関連付け、新しい要素gを作成しpieクラスを付与する
  var pieGraph = g
    .selectAll(".pie")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "pie");

  // 外側を半径の値内を中心で設定し、円の形状を定義
  var arc = d3.arc().outerRadius(radius).innerRadius(0);

  // pathに対して形状,色,透明度,境界線を設定
  pieGraph
    .append("path")
    .attr("d", arc)
    .attr("fill", function (d) {
      return color(d.index);
    })
    .attr("opacity", 1)
    .attr("stroke", "white");

  // ラベルの位置を設定
  var text = d3
    .arc()
    .outerRadius(radius - 40)
    .innerRadius(radius - 40);

  // テキストを追加し、表示
  pieGraph
    .append("text")
    .attr("fill", "black")
    .attr("transform", function (d) {
      return "translate(" + text.centroid(d) + ")";
    })
    .attr("dy", "5px")
    .attr("font-size", "10px")
    .attr("text-anchor", "middle")
    .text(function (d) {
      return d.data.key;
    });

  // パーセントをラベル(カラム)の下に表示
  pieGraph
    .append("text")
    .attr("fill", "black")
    .attr("transform", function (d) {
      return "translate(" + text.centroid(d) + ")";
    })
    .attr("dy", "2em")
    .attr("font-size", "10px")
    .attr("text-anchor", "middle")
    .text(function (d) {
      var percentage = ((d.value / total) * 100).toFixed(1); // 小数点以下1桁まで表示
      return percentage + "%";
    });
}

function chart() {
  const margin = { top: 60, right: 100, bottom: 50, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;
  
  const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
 
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
  
      // 色分け
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
      
      svg.append("text")
         .attr("x", width / 2)
         .attr("y", 0 - (margin.top/2))
         .attr("text-anchor", "middle")
         .style("font-size", "16px")
         .style("font-weight", "bold")
         .text("○○道における曜日別・時間帯別事故発生件数")
      
      svg.append("text")
         .attr("transform", `translate(${width / 2}, ${height + margin.top + 20})`)
         .style("text-anchor", "middle")
         .text("曜日");
      
      svg.append("text")
         .attr("transform", "rotate(-90)")
         .attr("y", 0 - margin.left -15)
         .attr("x", 0 - (height / 2) )
         .attr("dy", "1em")
         .style("text-anchor", "middle")
         .text("事故件数");
  
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
}

chart();
load_data("タイトル");