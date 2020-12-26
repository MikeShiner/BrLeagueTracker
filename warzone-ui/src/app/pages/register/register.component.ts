import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { RegisteredCaptain } from "src/app/services/models/server-models";
import { TrackerService } from "src/app/services/tracker.service";
import * as moment from "moment";
import { Subscription } from "rxjs";
@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent implements OnInit, OnDestroy {
  submitButtonDisable = true;
  submitButtonText = "Let's Go!";
  successMessageShow = false;
  failureMessageShow = false;
  registrationClosed = false;
  failureMessage = "";

  configSubscription: Subscription;

  captainForm: FormGroup = new FormGroup({
    captainId: new FormControl("", [Validators.required]),
    teamName: new FormControl("", [Validators.required]),
    mobile: new FormControl("", [
      Validators.required,
      Validators.minLength(11),
    ]),
  });

  registeredCaptains: RegisteredCaptain[];

  constructor(public trackerService: TrackerService) {}

  ngOnInit(): void {
    this.captainForm.valueChanges.subscribe((_) => {
      if (this.captainForm.valid) this.submitButtonDisable = false;
    });

    this.configSubscription = this.trackerService.config$
      .pipe()
      .subscribe((config) => {
        if (!config) return;
        let minutesTillDrop: number = moment(config?.startTime).diff(
          new Date(),
          "minutes"
        );
        if (minutesTillDrop < 31) {
          this.registrationClosed = true;
          this.submitButtonDisable = true;
        } else {
          this.registrationClosed = false;
        }
        this.getRegisteredCaptains();
      });
  }

  ngOnDestroy(): void {
    if (this.configSubscription) this.configSubscription.unsubscribe();
  }

  getRegisteredCaptains() {
    this.trackerService.getAllRegisteredCpatains().subscribe((res) => {
      this.registeredCaptains = res
        .map((captain) => {
          if (captain.captainId.includes("#")) {
            captain.captainId = captain.captainId.split("#")[0];
          }
          return captain;
        })
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
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
              this.captainForm.reset();
              this.getRegisteredCaptains();
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
