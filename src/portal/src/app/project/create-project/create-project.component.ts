
import {debounceTime} from 'rxjs/operators';
// Copyright (c) 2017 VMware, Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import {
  Component,
  EventEmitter,
  Output,
  ViewChild,
  OnInit,
  OnDestroy
} from "@angular/core";
import { Response } from "@angular/http";
import { NgForm } from "@angular/forms";

import { Subject } from "rxjs";
import { TranslateService } from "@ngx-translate/core";

import { MessageHandlerService } from "../../shared/message-handler/message-handler.service";
import { InlineAlertComponent } from "../../shared/inline-alert/inline-alert.component";

import { Project } from "../project";
import { ProjectService } from "../project.service";



@Component({
  selector: "create-project",
  templateUrl: "create-project.component.html",
  styleUrls: ["create-project.scss"]
})
export class CreateProjectComponent implements OnInit, OnDestroy {

  projectForm: NgForm;

  @ViewChild("projectForm")
  currentForm: NgForm;

  project: Project = new Project();
  initVal: Project = new Project();

  createProjectOpened: boolean;

  hasChanged: boolean;
  isSubmitOnGoing = false;

  staticBackdrop = true;
  closable = false;

  isNameValid = true;
  nameTooltipText = "PROJECT.NAME_TOOLTIP";
  checkOnGoing = false;
  proNameChecker: Subject<string> = new Subject<string>();

  @Output() create = new EventEmitter<boolean>();
  @ViewChild(InlineAlertComponent)
  inlineAlert: InlineAlertComponent;

  constructor(private projectService: ProjectService,
    private translateService: TranslateService,
    private messageHandlerService: MessageHandlerService) { }

  ngOnInit(): void {
    this.proNameChecker.pipe(
      debounceTime(300))
      .subscribe((name: string) => {
        let cont = this.currentForm.controls["create_project_name"];
        if (cont) {
          this.isNameValid = cont.valid;
          if (this.isNameValid) {
            // Check exiting from backend
            this.projectService
              .checkProjectExists(cont.value)
              .subscribe(() => {
                // Project existing
                this.isNameValid = false;
                this.nameTooltipText = "PROJECT.NAME_ALREADY_EXISTS";
                this.checkOnGoing = false;
              }, error => {
                this.checkOnGoing = false;
              });
          } else {
            this.nameTooltipText = "PROJECT.NAME_TOOLTIP";
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.proNameChecker.unsubscribe();
  }

  onSubmit() {
    if (this.isSubmitOnGoing) {
      return ;
    }

    this.isSubmitOnGoing = true;
    this.projectService
      .createProject(this.project.name, this.project.metadata)
      .subscribe(
      status => {
        this.isSubmitOnGoing = false;

        this.create.emit(true);
        this.messageHandlerService.showSuccess("PROJECT.CREATED_SUCCESS");
        this.createProjectOpened = false;
      },
      error => {
        this.isSubmitOnGoing = false;

        let errorMessage: string;
        if (error instanceof Response) {
          switch (error.status) {
            case 409:
              this.translateService.get("PROJECT.NAME_ALREADY_EXISTS").subscribe(res => errorMessage = res);
              break;
            case 400:
              this.translateService.get("PROJECT.NAME_IS_ILLEGAL").subscribe(res => errorMessage = res);
              break;
            default:
              this.translateService.get("PROJECT.UNKNOWN_ERROR").subscribe(res => errorMessage = res);
          }
        this.messageHandlerService.handleError(error);
        }
      });
  }

  onCancel() {
      this.createProjectOpened = false;
  }


  newProject() {
    this.project = new Project();
    this.hasChanged = false;
    this.isNameValid = true;

    this.createProjectOpened = true;
  }

  public get isValid(): boolean {
    return this.currentForm &&
    this.currentForm.valid &&
    !this.isSubmitOnGoing &&
    this.isNameValid &&
    !this.checkOnGoing;
  }

  // Handle the form validation
  handleValidation(): void {
    let cont = this.currentForm.controls["create_project_name"];
    if (cont) {
      this.proNameChecker.next(cont.value);
    }

  }
}

