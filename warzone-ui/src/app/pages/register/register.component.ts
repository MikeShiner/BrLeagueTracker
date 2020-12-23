import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { TrackerService } from "src/app/services/tracker.service";
@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent implements OnInit {
  submitButtonDisable = true;
  submitButtonText = "Let's Go!";
  successMessageShow = false;
  failureMessageShow = false;
  failureMessage = "";

  captainForm: FormGroup = new FormGroup({
    captainId: new FormControl("", [Validators.required]),
    teamName: new FormControl("", [Validators.required]),
    mobile: new FormControl("", [
      Validators.required,
      Validators.minLength(11),
    ]),
  });

  constructor(private trackerService: TrackerService) {}

  ngOnInit(): void {
    this.captainForm.valueChanges.subscribe((_) => {
      if (this.captainForm.valid) this.submitButtonDisable = false;
    });
  }

  onFormSubmit() {
    this.successMessageShow = false;
    this.failureMessageShow = false;
    this.submitButtonText = "Submitting..";
    this.submitButtonDisable = true;

    if (this.captainForm.valid) {
      this.trackerService
        .submitCaptainRegistration(
          this.captainForm.get("captainId").value,
          this.captainForm.get("teamName").value,
          this.captainForm.get("mobile").value
        )
        .subscribe(
          (res: { message: string }) => {
            console.log(res);
            if (res.message === "OK") {
              this.submitButtonText = "Let's Go!";
              this.successMessageShow = true;
            }
          },
          (error) => {
            console.log(error);
            this.failureMessageShow = true;
            this.failureMessage = error.error.message;
            this.submitButtonDisable = false;
            this.submitButtonText = "Let's Go!";
          }
        );
    }
  }
}
