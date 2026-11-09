import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvailableSurveysComponent } from './available-surveys';

describe('AvailableSurveysComponent', () => {
  let component: AvailableSurveysComponent;
  let fixture: ComponentFixture<AvailableSurveysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailableSurveysComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvailableSurveysComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
