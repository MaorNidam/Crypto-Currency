(function () {
    let cachedCoinsArray = new Array();

    let coinIdToCoinDataMap = new Map();
    let isMoreInfoOpen = new Set();

    let toggledCoins = new Set();
    let isModalOpen = false;

    let myInterval;

    $(function () {
        let url = "https://api.coingecko.com/api/v3/coins";
        $.get(url).then(function (coins) {
            $("#loader").hide();
            cachedCoinsArray = coins;
            addCoinsToUI(cachedCoinsArray);
        }).catch(() => alert("Failed to get from site."));

        $("#searchCoinButton").click(searchCoin);
        $("#searchCoinInput").keyup(function (event) { // Calls search function on "Enter" click. 
            let keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13') {
                searchCoin();
            }
        });

        $("#title").on("click", function () {
            homeClicked();
        })

        $("#about").on("click", function () {
            aboutClicked();
        })

        $("#home").on("click", function () {
            homeClicked();
        })

        $("#liveReports").on("click", function () {
            liveReportsClicked();
        })
    });


    function searchCoin() {
        let searchString = $("#searchCoinInput").val().toLowerCase();
        let searchedCoinArray = cachedCoinsArray.filter(function (coin) {
            return coin.name.toLowerCase().includes(searchString) || coin.symbol.toLowerCase().includes(searchString);
        });

        cleanUI();

        if (searchedCoinArray.length == 0) {
            alert("No coins were found.");
            searchedCoinArray = cachedCoinsArray;
        }

        addCoinsToUI(searchedCoinArray);
    }

    function addCoinsToUI(coins) {
        for (let coin of coins) {
            let coinDiv = $(`<div id="${coin.id}Div" class="card coin-card bg-dark">
                            <div id="${coin.id}Title"class="card-title form-switch">
                            <img src=${coin.image.thumb}>  ${coin.symbol}</div>${coin.name}<br>
                            </div>`);

            let moreInfoButton = $(`<button class="btn btn-outline-success btn-color btn-sm" id="${coin.id}MoreInfoButton">More Info</button>`);
            $(moreInfoButton).on("click", function () {
                moreInfoClicked(coin);
            });

            let liveReportSwitch = $(`<input class="form-check-input" id="${coin.id}Switch" type="checkbox">`);
            $(liveReportSwitch).on("click", function () {
                liveReportSwitchToggled(coin, `${coin.id}Switch`);
            })

            $("#coinBoard").append(coinDiv);
            $(coinDiv).append(moreInfoButton);
            $(`#${coin.id}Title`).append(liveReportSwitch);

            //If the coin was choosen for live reports,then show toggle on.
            if (toggledCoins.has(coin)) {
                $(liveReportSwitch).prop("checked", true);
            }

            // if more info was open, then display it open.
            if (isMoreInfoOpen.has(coin)) {
                isMoreInfoOpen.delete(coin);
                moreInfoClicked(coin);
            }
        }
    }

    //When more info was clicked.
    function moreInfoClicked(coin) {
        let coinDiv = $(`#${coin.id}Div`);
        let moreInfoButton = $(`#${coin.id}MoreInfoButton`);
        if (!isMoreInfoOpen.has(coin)) {
            isMoreInfoOpen.add(coin);

            moreInfoButton.html("Less Info");
            moreInfoButton.prop('disabled', true);
            coinDiv.addClass("open-coin-card");

            //Adds a loading gif until data will arrive.
            let loaderDiv = $(`<div id="loader" class="moreinfo-div-loader"><img class="moreinfo-img-loader" src="./images/loading.gif"></div>`);
            coinDiv.append(loaderDiv);

            //Looks for the coin info in the cached map, if not found, then sends GET request.
            if (coinIdToCoinDataMap.has(coin.id)) {
                loaderDiv.remove();
                moreInfoButton.prop('disabled', false);

                addMoreInfoToUi(coin, coinIdToCoinDataMap.get(coin.id));
            }
            else {
                let url = `https://api.coingecko.com/api/v3/coins/${coin.id}`;
                $.get(url).then(function (coinInfo) {
                    loaderDiv.remove();
                    moreInfoButton.prop('disabled', false);

                    saveMoreInfoToCache(coinInfo);
                    addMoreInfoToUi(coin, coinInfo);
                }).catch(() => "Failed to get more info.")
            }
        } else {
            isMoreInfoOpen.delete(coin);
            moreInfoButton.html("More Info");
            $(`#${coin.id}MoreInfoDiv`).remove();
            coinDiv.removeClass("open-coin-card");
        }
    }

    function addMoreInfoToUi(coin, coinInfo) {
        let usdPrice = coinInfo.market_data.current_price.usd;
        let euroPrice = coinInfo.market_data.current_price.eur;
        let ilsPrice = coinInfo.market_data.current_price.ils;

        let moreInfoDiv = `<div id="${coin.id}MoreInfoDiv" class="more-info">
                            <br>Usd : ${usdPrice}$
                            <br>Euro : ${euroPrice}€
                            <br>Ils : ${ilsPrice}₪</div>`;

        $(`#${coin.id}Div`).append(moreInfoDiv);
    }

    function saveMoreInfoToCache(coin) {
        coinIdToCoinDataMap.set(coin.id, coin);

        setTimeout(function () {
            coinIdToCoinDataMap.delete(coin.id);
        }, 120000);
    }

    //This function handles the clicks on toggles.
    function liveReportSwitchToggled(coin, switchId) {
        if (toggledCoins.size < 5 && !toggledCoins.has(coin)) {
            toggledCoins.add(coin);
        }
        else {
            if (toggledCoins.has(coin)) {
                toggledCoins.delete(coin);
                $(`#${switchId}`).prop("checked", false);
            }
            if (toggledCoins.size == 5) {
                if (!isModalOpen) {
                    openModal(coin);
                }
                else {
                    alert("Only 5 coins are allowed.");

                }
                $(`#${switchId}`).prop("checked", false);
            }
        }
    }

    function openModal(coin) {
        isModalOpen = true;
        $("#modalBody").html("");
        $("#modalFooter").html("");

        //Adding the 5 coins that was choosen before. 
        for (let item of toggledCoins) {
            addCoinToModal(item, "modalBody");
        }

        //Adding the 6th coin that was choosen to modal footer.
        addCoinToModal(coin, "modalFooter");

        $("#coinSwitchModal").modal("toggle");

        $("#modalCloseButton").on("click", function () {
            isModalOpen = false;
            $("#coinBoard").html("");
            addCoinsToUI(cachedCoinsArray);
        });
    }

    function addCoinToModal(coin, targetDivId) {
        let coinDiv = $(`<div class="modal-coin form-switch"><img src=${coin.image.thumb}> ${coin.name}</div>`);
        let coinSwitch = $(`<input class="form-check-input" id="${coin.id}ModalSwitch" checked type="checkbox">`);

        $(coinSwitch).on("click", function () {
            liveReportSwitchToggled(coin, `${coin.id}ModalSwitch`);
        })

        coinDiv.append(coinSwitch);
        $(`#${targetDivId}`).append(coinDiv);

        if (toggledCoins.has(coin)) {
            $(coinSwitch).prop("checked", true);
        }
        else {
            $(coinSwitch).prop("checked", false);
        }
    }

    function cleanUI() {
        $(".collapse").collapse("hide");
        $("#coinBoard").html("");
        $("#main").html("");
        $("#searchCoinInput").val("");
        if (myInterval != null) {
            clearInterval(myInterval);
            myInterval = null;
        }
    }

    function aboutClicked() {
        cleanUI();
        let aboutDiv = `<div id="aboutDiv" class = "about bg-dark text-center">
                <img class="profile-img img-fluid  d-sm-block" src="./images/profile.jpg"> Hello, my name is Maor Nidam and I am studying full stack development. </div>`;
        $("#main").append(aboutDiv);
    }

    function homeClicked() {
        cleanUI();
        addCoinsToUI(cachedCoinsArray);
    }

    function liveReportsClicked() {
        if (toggledCoins.size > 0) {
            cleanUI();

            let chartCanvasDiv = `<div id="chartDiv" class="chart bg-dark"><canvas class="my-4 w-100" id="coinChartCanvas" width="900" height="380"></canvas></div>`;
            $("#main").append(chartCanvasDiv);

            let coinsForGraph = [];
            toggledCoins.forEach((coin) => coinsForGraph.push(coin));

            let coinChart = drawCoinGraph();

            coinCharInit(coinChart, coinsForGraph);
            getCoinPricesAndAddToChartInterval(coinChart, coinsForGraph);
        }
        else {
            alert("Please select at least 1 coin to start live reports.")
        }
    }

    // Creates Chars js live reports graph.
    function drawCoinGraph() {
        // Graphs
        let ctx = $("#coinChartCanvas");
        // eslint-disable-next-line no-unused-vars
        let coinChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                scales: {
                    x: {
                        grid: {
                            display: true,
                            drawBorder: true,
                            drawOnChartArea: true,
                            drawTicks: true,
                            color: "#e3f4f6"
                        },
                        ticks: {
                            color: "#e3f4f6"
                        }
                    },
                    y: {
                        grid: {
                            display: true,
                            drawBorder: true,
                            drawOnChartArea: true,
                            drawTicks: true,
                            color: "#e3f4f6"
                        },
                        ticks: {
                            // Include a dollar sign in the ticks
                            callback: function (value, index, ticks) {
                                return '$' + value;
                            },
                            color: "#e3f4f6"
                        }

                    }
                }

            }
        })
        Chart.defaults.borderColor = "#e3f4f6";
        Chart.defaults.color = "#e3f4f6";
        return coinChart;
    }

    //Creates datesets for each coin and adds them to live report graph.
    function coinCharInit(chart, coinsForGraph) {
        let colorArray = ['#007bff', '#0dcaf0', `#d4d072`, '#a04846', '#20c997'];
        for (let i = 0; i < coinsForGraph.length; i++) {
            let newDataset = {
                label: coinsForGraph[i].name,
                data: [],
                lineTension: 0,
                backgroundColor: 'transparent',
                borderColor: colorArray[i],
                borderWidth: 2,
                pointBackgroundColor: colorArray[i]
            }
            chart.data.datasets.push(newDataset);
            chart.update();
        }
    }

    //Starts a 2 seconds time interval, getting the selected coins updated price, and adding them to the graph.
    function getCoinPricesAndAddToChartInterval(chart, coinsForGraph) {
        if (myInterval == undefined) {
            myInterval = setInterval(function () {
                let currentTimeForGraph = generateCurrentTimeString();
                chart.data.labels.push(currentTimeForGraph);

                let url = generateCoinChartURL(coinsForGraph);
                $.get(url).then(function (prices) {
                    let i = 0;
                    for (let [key, coinPrice] of Object.entries(prices)) {
                        let price = coinPrice;
                        chart.data.datasets[i].data.push(price.USD);
                        chart.update();
                        i++;
                    }
                })
            }, 2000);
        }
    }

    //Creates current time string for graph's X axis.
    function generateCurrentTimeString() {
        let currentTime = new Date().toString();
        let formatedTime = currentTime.substring(16, 25);
        return formatedTime;
    }

    //Creates GET request with the choosen coins.
    function generateCoinChartURL(coinsForGraph) {
        let url = 'https://min-api.cryptocompare.com/data/pricemulti?fsyms='

        for (let coin of coinsForGraph) {
            url += `${coin.symbol},`
        }

        url = url.slice(0, url.length - 1);
        url += `&tsyms=USD`;
        return url;
    }

})();