const $ = window.jQuery
window.redhatter = true

$(function () {
    const link = $("#supportExceptionLink")[0]
    link.innerHTML = `<a style="background-color: white"
        href="https://tools.apps.cee.redhat.com/support-exceptions/add">
        open a support exception ticket
        </a>`
})