"use strict";

(function()
{
    var TOC_LEVEL_LIST = [".section1-toc", ".section2-toc", ".section3-toc"];

    var column = document.querySelector(".page-toc");
    var toc = document.querySelector(".page-toc-inner") || column;
    var bar = document.querySelector(".page-menu");

    if (toc === null)
        return;

    var linkMap = Object.create(null);
    var linkList = toc.querySelectorAll("a[href^='#']");

    for (var linkIdx = 0; linkIdx < linkList.length; linkIdx++)
    {
        var id = decodeURIComponent(linkList[linkIdx].getAttribute("href").substring(1));

        if (id !== "")
            linkMap[id] = linkList[linkIdx];
    }

    var anchorList = [];
    var anchorAll = document.querySelectorAll(".page-body a[id]");

    for (var anchorIdx = 0; anchorIdx < anchorAll.length; anchorIdx++)
    {
        if (anchorAll[anchorIdx].id in linkMap)
            anchorList.push(anchorAll[anchorIdx]);
    }

    if (anchorList.length === 0)
        return;

    function markAdd(link)
    {
        link.classList.add("toc-active");

        var node = link.closest(TOC_LEVEL_LIST.join(", "));

        while (node !== null && node.parentElement !== null)
        {
            node = node.parentElement.closest(TOC_LEVEL_LIST.join(", "));

            if (node !== null)
            {
                var parent = node.querySelector(":scope > [class$='-toc-title'] > a");

                if (parent !== null)
                    parent.classList.add("toc-active-parent");
            }
        }
    }

    function fit()
    {
        if (window.getComputedStyle(toc).position !== "sticky")
        {
            toc.style.maxHeight = "";

            return;
        }

        var barBox = bar === null ? null : bar.getBoundingClientRect();
        var top = Math.max(barBox === null ? 0 : barBox.height, column.getBoundingClientRect().top);

        toc.style.maxHeight = Math.max(0, window.innerHeight - top) + "px";
    }

    function markShow(link)
    {
        if (toc.scrollHeight <= toc.clientHeight)
            return;

        var linkBox = link.getBoundingClientRect();
        var tocBox = toc.getBoundingClientRect();

        if (linkBox.top < tocBox.top || linkBox.bottom > tocBox.bottom)
            toc.scrollTop += linkBox.top - tocBox.top - toc.clientHeight / 3;
    }

    var active = null;
    var pending = false;

    var edge = null;

    function mark()
    {
        pending = false;

        fit();

        if (edge === null)
            edge = parseFloat(window.getComputedStyle(anchorList[0]).scrollMarginTop) + 1;

        var found = anchorList[0];

        for (var idx = 0; idx < anchorList.length; idx++)
        {
            if (anchorList[idx].getBoundingClientRect().top > edge)
                break;

            found = anchorList[idx];
        }

        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2)
            found = anchorList[anchorList.length - 1];

        if (found === active)
            return;

        active = found;

        var markList = toc.querySelectorAll(".toc-active, .toc-active-parent");

        for (var markIdx = 0; markIdx < markList.length; markIdx++)
            markList[markIdx].classList.remove("toc-active", "toc-active-parent");

        markAdd(linkMap[found.id]);
        markShow(linkMap[found.id]);
    }

    function schedule()
    {
        if (pending)
            return;

        pending = true;
        window.requestAnimationFrame(mark);
    }

    function resize()
    {
        edge = null;

        schedule();
    }

    window.addEventListener("scroll", schedule, {passive: true});
    window.addEventListener("resize", resize, {passive: true});

    mark();
})();

(function()
{
    var blockList = document.querySelectorAll("pre[tabindex], .execute-body-output[tabindex], .config-body-output[tabindex]");

    if (blockList.length === 0)
        return;

    var pending = false;

    function reach()
    {
        pending = false;

        for (var idx = 0; idx < blockList.length; idx++)
        {
            if (blockList[idx].scrollWidth > blockList[idx].clientWidth + 1)
                blockList[idx].setAttribute("tabindex", "0");
            else
                blockList[idx].removeAttribute("tabindex");
        }
    }

    function schedule()
    {
        if (pending)
            return;

        pending = true;
        window.requestAnimationFrame(reach);
    }

    window.addEventListener("resize", schedule, {passive: true});

    reach();
})();

(function()
{
    var SAID_TIME = 2000;

    var buttonList = document.querySelectorAll(".code-copy");

    if (buttonList.length === 0 || navigator.clipboard === undefined)
        return;

    function copyText(button)
    {
        var block = button.closest(".execute-body-cmd, .config");
        var lineList = block.querySelectorAll(".execute-cmd, .config-line, .config-line-add");
        var result = "";

        for (var idx = 0; idx < lineList.length; idx++)
            result += lineList[idx].textContent + "\n";

        return result;
    }

    function ready(button)
    {
        var timeout = null;

        function reset()
        {
            button.classList.remove("code-copy-done", "code-copy-fail");
            timeout = null;
        }

        function said(state)
        {
            if (timeout !== null)
                window.clearTimeout(timeout);

            reset();

            button.classList.add(state);
            timeout = window.setTimeout(reset, SAID_TIME);
        }

        function done()
        {
            said("code-copy-done");
        }

        function fail()
        {
            said("code-copy-fail");
        }

        function copy()
        {
            navigator.clipboard.writeText(copyText(button)).then(done, fail);
        }

        button.addEventListener("click", copy);
        button.classList.add("code-copy-ready");
    }

    for (var buttonIdx = 0; buttonIdx < buttonList.length; buttonIdx++)
        ready(buttonList[buttonIdx]);
})();
