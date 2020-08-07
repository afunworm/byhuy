import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VisitorComponent } from './visitor/visitor.component';
import { AdminComponent } from './admin/admin.component';

const routes: Routes = [
	{ path: '', component: VisitorComponent, pathMatch: 'full' },
	{ path: 'admin/:id', component: AdminComponent },
	{ path: '**', component: VisitorComponent },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
