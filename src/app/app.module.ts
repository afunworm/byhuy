import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';

import { environment } from '../environments/environment';
import * as firebase from 'firebase/app';
import { VisitorComponent } from './visitor/visitor.component';
import { AdminComponent } from './admin/admin.component';

// Initialize Firebase
firebase.initializeApp(environment.firebaseConfig);

@NgModule({
	declarations: [AppComponent, VisitorComponent, AdminComponent],
	imports: [BrowserModule, AppRoutingModule, BrowserAnimationsModule, FlexLayoutModule],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
