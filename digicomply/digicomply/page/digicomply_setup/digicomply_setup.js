frappe.pages["digicomply-setup"].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: "DigiComply Setup",
        single_column: true
    });

    // Hide standard page header
    $(wrapper).find(".page-head").hide();

    // Load the template
    $(frappe.render_template("digicomply_setup")).appendTo(page.body);

    new DigiComplySetup(page);
};

class DigiComplySetup {
    constructor(page) {
        this.page = page;
        this.current_step = 1;
        this.total_steps = 5;
        this.data = {};

        this.bind_events();
        this.update_ui();
    }

    bind_events() {
        const self = this;

        $("#next-btn").on("click", function() {
            if (self.validate_step()) {
                self.save_step_data();
                if (self.current_step < self.total_steps) {
                    self.current_step++;
                    self.update_ui();
                } else {
                    self.complete_setup();
                }
            }
        });

        $("#prev-btn").on("click", function() {
            if (self.current_step > 1) {
                self.current_step--;
                self.update_ui();
            }
        });

        $("#add-user").on("click", function() {
            self.add_user_row();
        });
    }

    validate_step() {
        if (this.current_step === 1) {
            const company = $("#company_name").val();
            const trn = $("#trn").val();

            if (!company) {
                frappe.msgprint("Please enter company name");
                return false;
            }
            if (!trn || trn.length !== 15) {
                frappe.msgprint("Please enter valid 15-digit TRN");
                return false;
            }
        }
        return true;
    }

    save_step_data() {
        const self = this;
        if (this.current_step === 1) {
            this.data.company_name = $("#company_name").val();
            this.data.trn = $("#trn").val();
        } else if (this.current_step === 2) {
            this.data.currency = $("#currency").val();
            this.data.fiscal_year_start = $("#fiscal_year_start").val();
        } else if (this.current_step === 3) {
            this.data.asp_provider = $("#asp_provider").val();
            this.data.asp_api_key = $("#asp_api_key").val();
        } else if (this.current_step === 4) {
            this.data.users = [];
            $(".user-row").each(function() {
                const email = $(this).find("input").val();
                const role = $(this).find("select").val();
                if (email) {
                    self.data.users.push({ email, role });
                }
            });
        }
    }

    update_ui() {
        const self = this;
        // Update progress
        $(".setup-progress .step").each(function() {
            const step = $(this).data("step");
            $(this).removeClass("active completed");
            if (step < self.current_step) {
                $(this).addClass("completed");
            } else if (step === self.current_step) {
                $(this).addClass("active");
            }
        });

        // Show current step
        $(".setup-step").hide();
        $(`.setup-step[data-step="${this.current_step}"]`).show();

        // Update buttons
        $("#prev-btn").toggle(this.current_step > 1);
        $("#next-btn").text(this.current_step === this.total_steps ? "Go to Dashboard" : "Next");
    }

    add_user_row() {
        const row = `
            <div class="user-row">
                <input type="email" class="form-control" placeholder="Email address" />
                <select class="form-control">
                    <option value="Accounts User">Accounts User</option>
                    <option value="Accounts Manager">Accounts Manager</option>
                </select>
            </div>
        `;
        $("#users-container").append(row);
    }

    complete_setup() {
        frappe.call({
            method: "digicomply.digicomply.page.digicomply_setup.digicomply_setup.complete_setup",
            args: { data: this.data },
            callback: function(r) {
                if (r.message && r.message.success) {
                    frappe.set_route("app", "compliance-dashboard");
                } else {
                    frappe.msgprint("Setup completed. Redirecting...");
                    setTimeout(function() {
                        frappe.set_route("app", "compliance-dashboard");
                    }, 1000);
                }
            }
        });
    }
}
