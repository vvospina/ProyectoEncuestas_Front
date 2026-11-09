import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SurveysComponent } from './surveys';

describe('SurveysComponent', () => {
  let component: SurveysComponent;
  let fixture: ComponentFixture<SurveysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveysComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveysComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
