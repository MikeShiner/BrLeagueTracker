import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { TrackerService } from "src/app/services/tracker.service";
import { catchError } from "rxjs/operators";
@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent implements OnInit {
  submitButtonDisable = true;
  submitButtonText = "Let's Go!";
  captainForm: FormGroup = new FormGroup({
    activisionId: new FormControl("", [Validators.required]),
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
    this.submitButtonText = "Submitting..";
    this.submitButtonDisable = true;
    if (this.captainForm.valid) {
      this.trackerService
        .submitCaptainRegistration(
          this.captainForm.get("activisionId").value,
          this.captainForm.get("teamName").value,
          this.captainForm.get("mobile").value
        )
        .subscribe((res) => console.log("RES", res));
    }
  }
}
