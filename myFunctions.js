document.querySelectorAll(".show-details").forEach(function (checkbox) {
    checkbox.addEventListener("change", function () {
        var detailsRow = checkbox.closest("tr").nextElementSibling;
        if (detailsRow && detailsRow.classList.contains("details-row")) {
            detailsRow.classList.toggle("is-visible", checkbox.checked);
        }
    });
});

document.querySelectorAll(".cars-btn").forEach(function (link) {
    link.addEventListener("click", function (event) {
        var selectedCars = document.querySelectorAll(".select-car:checked");
        if (selectedCars.length === 0) {
            event.preventDefault();
            alert("يجب اختيار سيارة اولاً");
            return;
        }

        var bookingUrl = new URL(link.href);
        selectedCars.forEach(function (checkbox) {
            var cells = checkbox.closest("tr").querySelectorAll("td");
            var carName = cells[2].textContent.trim();
            var dailyRate = cells[4].textContent.replace(/[^\d]/g, "");
            bookingUrl.searchParams.append("car", carName);
            bookingUrl.searchParams.append("dailyRate", dailyRate);
        });
        event.preventDefault();
        window.location.href = bookingUrl.toString();
    });
});

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}

function processBooking() {
    var fullName = document.getElementById("fullName").value.trim();
    var mobile = document.getElementById("mobile").value.trim();
    var nationalId = document.getElementById("nationalId").value.trim();
    var email = document.getElementById("email").value.trim();
    var startDate = document.getElementById("startDate").value;
    var endDate = document.getElementById("endDate").value;
    var urlParams = new URLSearchParams(window.location.search);
    var selectedCars = urlParams.getAll("car").filter(function (car) {
        return car.trim() !== "";
    });
    if (selectedCars.length === 0) {
        selectedCars.push("لم يتم اختيار سيارة مسبقاً");
    }

    var dailyRates = urlParams.getAll("dailyRate").map(Number).filter(function (rate) {
        return Number.isFinite(rate) && rate > 0;
    });
    var combinedDailyRate = dailyRates.reduce(function (total, rate) {
        return total + rate;
    }, 0);
    var errors = [];

    if (nationalId === "") {
        errors.push("- الرقم الوطني إلزامي.");
    } else if (!/^\d{11}$/.test(nationalId)) {
        errors.push("- الرقم الوطني يجب أن يتكون من 11 رقماً فقط.");
    }
    if (startDate === "") {
        errors.push("- تاريخ البداية إلزامي.");
    }
    if (endDate === "") {
        errors.push("- تاريخ النهاية إلزامي.");
    }
    if (mobile !== "" && !/^09[0-9]{8}$/.test(mobile)) {
        errors.push("- رقم الموبايل يجب أن يبدأ بـ 09 ويتكون من 10 أرقام.");
    }
    if (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("- البريد الإلكتروني غير صحيح.");
    }

    var startTime;
    var endTime;
    if (startDate !== "" && endDate !== "") {
        startTime = Date.parse(startDate + "T00:00:00Z");
        endTime = Date.parse(endDate + "T00:00:00Z");
        if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
            errors.push("- تاريخ النهاية يجب أن يكون بعد تاريخ البداية أو مساوياً له.");
        }
    }

    if (errors.length > 0) {
        alert("يرجى تصحيح الأخطاء التالية:\n" + errors.join("\n"));
        return;
    }

    var days = Math.max(1, Math.ceil((endTime - startTime) / 86400000));
    var totalBeforeDiscount = days * combinedDailyRate;
    var discount = days > 7 ? totalBeforeDiscount * 0.10 : 0;
    var finalAmount = totalBeforeDiscount - discount;

    function formatMoney(amount) {
        return amount.toLocaleString("en-US") + " ل.س";
    }

    var carLabel = selectedCars.length === 1 ? "السيارة المختارة" : "السيارات المختارة";
    var details = "";
    details += "<p><strong>" + carLabel + ":</strong> " + selectedCars.map(escapeHtml).join("، ") + "</p>";
    details += "<p><strong>الاسم:</strong> " + escapeHtml(fullName || "غير مدخل") + "</p>";
    details += "<p><strong>رقم الموبايل:</strong> " + escapeHtml(mobile || "غير مدخل") + "</p>";
    details += "<p><strong>الرقم الوطني:</strong> " + escapeHtml(nationalId) + "</p>";
    details += "<p><strong>البريد الإلكتروني:</strong> " + escapeHtml(email || "غير مدخل") + "</p>";
    details += "<p><strong>تاريخ البداية:</strong> " + escapeHtml(startDate) + "</p>";
    details += "<p><strong>تاريخ النهاية:</strong> " + escapeHtml(endDate) + "</p>";
    details += "<p><strong>عدد أيام التأجير:</strong> " + days + " يوم</p>";
    details += "<p><strong>السعر اليومي للسيارة/السيارات المختارة:</strong> " + formatMoney(combinedDailyRate) + "</p>";
    details += "<p><strong>المجموع قبل الخصم:</strong> " + formatMoney(totalBeforeDiscount) + "</p>";
    details += "<p><strong>الخصم" + (days > 7 ? " (10%)" : " (0% - مدة 7 أيام أو أقل)") + ":</strong> " + formatMoney(discount) + "</p>";
    details += "<p><strong>المبلغ النهائي:</strong> " + formatMoney(finalAmount) + "</p>";

    document.getElementById("resultDetails").innerHTML = details;
    document.getElementById("resultModal").style.display = "block";
}

function closeModal() {
    document.getElementById("resultModal").style.display = "none";
}

function confirmBooking() {
    document.getElementById("resultModal").style.display = "none";
    alert("تم تأكيد الحجز بنجاح");
}
